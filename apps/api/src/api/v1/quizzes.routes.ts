import { Hono } from "hono";
import { generateQuiz } from "./services/quiz-generator.service";
import {
  quizGenerationRequestSchema,
  quizResponseSchema,
} from "./schemas/quiz.schemas";
import { createDb } from "../../db/index";
import { userUsageData } from "../../../drizzle/schema";
import { getSupabase } from "./middleware/auth.middleware";
import { validator as zValidator, resolver } from "hono-openapi/zod";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

const generate = new Hono<{ Bindings: CloudflareEnv }>().get(
  "/generate",
  describeRoute({
    tags: ["Quizzes"],
    summary: "Generate a quiz",
    description: "Generate a quiz based on the given topic and description",
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
    },
  }),
  zValidator("query", quizGenerationRequestSchema),
  async (c) => {
    const validatedData = c.req.valid("query");

    const { quiz, metrics } = await generateQuiz(
      c,
      validatedData.quizTopic,
      validatedData.quizDescription,
      validatedData.numberOfQuestions,
      validatedData.quizTags,
      validatedData.language
    );

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
    });

    return c.json({ quiz: quiz } as const);
  }
);

export default generate;
