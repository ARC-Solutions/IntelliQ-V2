import { Hono } from "hono";
import { generateQuiz } from "../services/quiz-generator.service";
import { createTranslateClient, translateQuiz } from "../utils/translator";
import { quizGenerationRequestSchema, supportedLanguages } from "../schemas";

const quizzes = new Hono<{ Bindings: CloudflareEnv }>();

quizzes.get("/generate", async (c) => {
  try {
    const { searchParams } = new URL(c.req.url);
    const result = quizGenerationRequestSchema.safeParse({
      quizTopic: searchParams.get("quizTopic") || "",
      quizDescription: searchParams.get("quizDescription") || "",
      numberOfQuestions: Number(searchParams.get("numberOfQuestions")) || 4,
      quizTags: searchParams.get("quizTags") || "",
      language:
        searchParams.get("language")?.toLowerCase() ||
        supportedLanguages.Enum.en,
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
      { env: c.env as { GPT_MODEL: string; OPENAI_API_KEY: string } },
      result.data.quizTopic,
      result.data.quizDescription,
      result.data.numberOfQuestions,
      result.data.quizTags!
    );

    // Translation handling
    if (result.data.language !== supportedLanguages.Enum.en) {
      const translateClient = createTranslateClient({
        env: {
          AMAZON_REGION: c.env.AMAZON_REGION,
          AMAZON_ACCESS_KEY_ID: c.env.AMAZON_ACCESS_KEY_ID,
          AMAZON_SECRET_ACCESS_KEY: c.env.AMAZON_SECRET_ACCESS_KEY,
        },
      });
      const translatedQuiz = await translateQuiz(
        quiz,
        result.data.language,
        translateClient
      );
      return c.json({ rawQuestions: translatedQuiz });
    }

    return c.json({ rawQuestions: quiz });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return c.json(
      {
        message: "An unexpected error occurred",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export { quizzes };
