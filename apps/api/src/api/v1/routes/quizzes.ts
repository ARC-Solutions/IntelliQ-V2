import { Hono } from "hono";
import { generateQuiz } from "@services/quiz-generator.service";
import { quizGenerationRequestSchema } from "@schemas/quiz.schemas";
import { createDb } from "@/db";
import { userUsageData } from "@drizzle/schema";
import { getSupabase } from "@middleware/auth.middleware";
import { zValidator } from "@hono/zod-validator";

const quizzes = new Hono<{ Bindings: CloudflareEnv }>();

quizzes.get(
  "/generate",
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

export { quizzes };
