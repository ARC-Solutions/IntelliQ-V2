import { RedisStore } from "@hono-rate-limiter/redis";
import { Redis } from "@upstash/redis/cloudflare";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { rateLimiter } from "hono-rate-limiter";
import { z } from "zod";
import { userUsageData } from "../../../drizzle/schema";
import { createDb } from "../../db/index";
import { getSupabase } from "./middleware/auth.middleware";
import {
  quizGenerationRequestSchema,
  quizResponseSchema,
} from "./schemas/quiz.schemas";
import { generateQuiz } from "./services/quiz-generator.service";
import {
  TranslateClient,
  TranslateTextCommand,
} from "@aws-sdk/client-translate";

const generate = new Hono<{ Bindings: CloudflareEnv }>()
  .use((c, next) =>
    rateLimiter<{ Bindings: CloudflareEnv }>({
      windowMs: 30 * 1000,
      limit: 3,
      standardHeaders: "draft-6",
      keyGenerator: (c) => c.req.header("cf-connecting-ip") ?? "",
      store: new RedisStore({
        client: new Redis({
          url: c.env.UPSTASH_REDIS_REST_URL,
          token: c.env.UPSTASH_REDIS_REST_TOKEN,
        }),
      }),
      handler: (c) => c.json({ error: "Too many requests" }, 429),
    })(c, next)
  )
  .get(
    "/generate",
    describeRoute({
      tags: ["Quizzes"],
      summary: "Generate a quiz",
      description: "Generate a quiz based on the given topic and description",
      validateResponse: true,
      responses: {
        200: {
          description: "Quiz generated successfully",
          content: {
            "application/json": {
              schema: resolver(quizResponseSchema),
            },
          },
        },
        400: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
        429: {
          description: "Too many requests",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
      },
    }),
    zValidator("query", quizGenerationRequestSchema),
    async (c) => {
      const validatedData = c.req.valid("query");

      const { quiz, metrics } = await generateQuiz(
        c,
        validatedData.quizTopic,
        validatedData.numberOfQuestions,
        validatedData.quizDescription!,
        validatedData.quizTags,
        validatedData.language
      );

      // Translate quiz content if language is not English
      if (validatedData.language && validatedData.language !== "en") {
        const translateClient = new TranslateClient({
          region: "eu-north-1",
          credentials: {
            accessKeyId: c.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: c.env.AWS_SECRET_ACCESS_KEY!,
          },
        });

        // Translate quiz title
        const titleCommand = new TranslateTextCommand({
          SourceLanguageCode: "en",
          TargetLanguageCode: validatedData.language,
          Text: quiz.quizTitle,
        });
        const titleResponse = await translateClient.send(titleCommand);
        quiz.quizTitle = titleResponse.TranslatedText || quiz.quizTitle;

        // Translate each question
        for (const question of quiz.questions) {
          // Translate question title
          const questionTitleCommand = new TranslateTextCommand({
            SourceLanguageCode: "en",
            TargetLanguageCode: validatedData.language,
            Text: question.questionTitle,
          });
          const questionTitleResponse = await translateClient.send(
            questionTitleCommand
          );
          question.questionTitle =
            questionTitleResponse.TranslatedText || question.questionTitle;

          // Translate question text
          const textCommand = new TranslateTextCommand({
            SourceLanguageCode: "en",
            TargetLanguageCode: validatedData.language,
            Text: question.text,
          });
          const textResponse = await translateClient.send(textCommand);
          question.text = textResponse.TranslatedText || question.text;

          // Translate options
          const optionsText = question.options.join("\n");
          const optionsCommand = new TranslateTextCommand({
            SourceLanguageCode: "en",
            TargetLanguageCode: validatedData.language,
            Text: optionsText,
          });
          const optionsResponse = await translateClient.send(optionsCommand);
          if (optionsResponse.TranslatedText) {
            question.options = optionsResponse.TranslatedText.split("\n");
          }

          // Translate correct answer
          const correctAnswerCommand = new TranslateTextCommand({
            SourceLanguageCode: "en",
            TargetLanguageCode: validatedData.language,
            Text: question.correctAnswer,
          });
          const correctAnswerResponse = await translateClient.send(
            correctAnswerCommand
          );
          question.correctAnswer =
            correctAnswerResponse.TranslatedText || question.correctAnswer;
        }
      }

      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const db = await createDb(c);
      await db.insert(userUsageData).values({
        userId: user!.id,
        promptTokens: metrics.usage.promptTokens,
        completionTokens: metrics.usage.completionTokens,
        totalTokens: metrics.usage.totalTokens,
        usedModel: c.env.GPT_MODEL,
        countQuestions: validatedData.numberOfQuestions,
        responseTimeTaken: metrics.durationInSeconds,
        prompt: validatedData.quizTopic,
        language: validatedData.language,
        quizType: validatedData.quizType,
      });

      return c.json({ quiz: quiz } as const);
    }
  );

export default generate;
