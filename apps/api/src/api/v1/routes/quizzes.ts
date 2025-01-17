import { Hono } from "hono";
import { generateQuiz } from "../services/quiz-generator.service";
import { quizGenerationRequestSchema, supportedLanguages } from "../schemas";
import { createDb } from "../../../db";
import { userUsageData } from "../../../../drizzle/schema";
import { getSupabase } from "../middleware/auth.middleware";

const quizzes = new Hono<{ Bindings: CloudflareEnv }>();

quizzes.get("/generate", async (c) => {
  let result;
  try {
    const { searchParams } = new URL(c.req.url);
    result = quizGenerationRequestSchema.safeParse({
      quizTopic: searchParams.get("quizTopic") || "",
      quizDescription: searchParams.get("quizDescription") || "",
      numberOfQuestions: Number(searchParams.get("numberOfQuestions")) || 4,
      quizTags: searchParams.get("quizTags")?.split(",") || [],
      language: searchParams.get("language")?.toLowerCase() || "en",
    });

    if (!result.success) {
      return c.json(
        {
          error: "Validation error",
          details: result.error.flatten().fieldErrors,
        },
        400
      );
    }

    const quiz = await generateQuiz(
      c,
      result.data.quizTopic,
      result.data.quizDescription,
      result.data.numberOfQuestions,
      result.data.quizTags!,
      result.data.language
    );

    const supabase = getSupabase(c);
    const user = await supabase.auth.getUser();

    if (!user.data.user?.id) {
      return c.json(
        {
          error: "Authentication required",
          message: "User must be authenticated to generate quizzes",
        },
        401
      );
    }

    const db = await createDb(c);
    await db.insert(userUsageData).values({
      userId: user.data.user.id,
      promptTokens: quiz.metrics.usage.promptTokens,
      completionTokens: quiz.metrics.usage.completionTokens,
      totalTokens: quiz.metrics.usage.totalTokens,
      usedModel: c.env.GPT_MODEL,
      countQuestions: result.data.numberOfQuestions,
      responseTimeTaken: quiz.metrics.durationInSeconds,
      prompt: result.data.quizTopic,
      language: result.data.language,
    });

    return c.json({ rawQuestions: quiz });
  } catch (error) {
    let errorResponse;

    try {
      // Try to parse the error message as JSON
      const errorDetails =
        error instanceof Error
          ? JSON.parse(error.message)
          : { message: "Unknown error" };

      errorResponse = {
        message: "Quiz generation failed",
        details: errorDetails,
        requestParams: {
          quizTopic: result?.data?.quizTopic,
          quizDescription: result?.data?.quizDescription,
          numberOfQuestions: result?.data?.numberOfQuestions,
          quizTags: result?.data?.quizTags,
          language: result?.data?.language,
        },
      };
    } catch (parseError) {
      // Fallback if error message isn't JSON
      errorResponse = {
        message: "An unexpected error occurred",
        error: error instanceof Error ? error.message : "Unknown error",
        requestParams: {
          quizTopic: result?.data?.quizTopic,
          quizDescription: result?.data?.quizDescription,
          numberOfQuestions: result?.data?.numberOfQuestions,
          quizTags: result?.data?.quizTags,
          language: result?.data?.language,
        },
      };
    }

    console.error("Error in quiz generation:", JSON.stringify(errorResponse));
    return c.json(errorResponse, 500);
  }
});

export { quizzes };
