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
      const {
        quizTopic,
        numberOfQuestions,
        quizTags,
        quizDescription,
        language,
        quizType,
      } = c.req.valid("query");

      const { quiz, metrics } = await generateQuiz(
        c,
        quizTopic,
        numberOfQuestions,
        quizTags,
        quizDescription!,
      );

      // translate quiz content if language is not English
      if (language && language !== "en") {
        const translateClient = new TranslateClient({
          region: "eu-north-1",
          credentials: {
            accessKeyId: c.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: c.env.AWS_SECRET_ACCESS_KEY!,
          },
        });

        // translate quiz title
        const titleCommand = new TranslateTextCommand({
          SourceLanguageCode: "en",
          TargetLanguageCode: language,
          Text: quiz.quizTitle,
        });
        const titleResponse = await translateClient.send(titleCommand);
        quiz.quizTitle = titleResponse.TranslatedText || quiz.quizTitle;

        // translate each question
        for (const question of quiz.questions) {
          // translate question title
          const questionTitleCommand = new TranslateTextCommand({
            SourceLanguageCode: "en",
            TargetLanguageCode: language,
            Text: question.questionTitle,
          });
          const questionTitleResponse = await translateClient.send(
            questionTitleCommand
          );
          question.questionTitle =
            questionTitleResponse.TranslatedText || question.questionTitle;

          // translate question text
          const textCommand = new TranslateTextCommand({
            SourceLanguageCode: "en",
            TargetLanguageCode: language,
            Text: question.text,
          });
          const textResponse = await translateClient.send(textCommand);
          question.text = textResponse.TranslatedText || question.text;

          // translate options
          const optionsText = question.options.join("\n");
          const optionsCommand = new TranslateTextCommand({
            SourceLanguageCode: "en",
            TargetLanguageCode: language,
            Text: optionsText,
          });
          const optionsResponse = await translateClient.send(optionsCommand);
          if (optionsResponse.TranslatedText) {
            question.options = optionsResponse.TranslatedText.split("\n");
          }

          // translate correct answer
          const correctAnswerCommand = new TranslateTextCommand({
            SourceLanguageCode: "en",
            TargetLanguageCode: language,
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
        countQuestions: numberOfQuestions,
        responseTimeTaken: metrics.durationInSeconds,
        prompt: quizTopic,
        language: language,
        quizType: quizType,
      });

      return c.json({ quiz: quiz } as const);
    }
  );

export default generate;