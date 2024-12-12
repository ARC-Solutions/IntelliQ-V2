import { generateQuizPrompt } from "@/app/api/v1/prompts";
import {
  quizGenerationRequestSchema,
  supportedLanguages,
} from "@/app/api/v1/schemas";
import { db } from "@/db";
import { createClient } from "@/lib/supabase/supabase-server-side";
import { userUsageData } from "@drizzle/schema";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { generateQuiz } from "./services/quiz-generator.service";
import { createTranslateClient, translateQuiz } from "./utils/translator";

// const ratelimit = new Ratelimit({
//   redis: Redis.fromEnv(),
//   limiter: Ratelimit.slidingWindow(2, "30 s"),
// });

export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
  try {
    // Get user
    // const supabase = createClient();
    // const {
    //   data: { user },
    // } = await supabase.auth.getUser();

    // Rate limiting
    // const { success } = await ratelimit.limit(user?.id!);

    // if (!success) {
    //   console.log("Unable to process at this time");
    //   return NextResponse.json({ error: "Quota exceeded" }, { status: 429 });
    // }

    // Validate request
    const { searchParams } = request.nextUrl;
    const result = quizGenerationRequestSchema.safeParse({
      quizTopic: searchParams.get("quizTopic"),
      quizDescription: searchParams.get("quizDescription"),
      numberOfQuestions: searchParams.get("numberOfQuestions"),
      quizTags: searchParams.get("quizTags"),
      language:
        searchParams.get("language")?.toLowerCase() ||
        supportedLanguages.Enum.en,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      quizTopic,
      quizDescription,
      numberOfQuestions,
      quizTags,
      language,
    } = result.data;

    // Generate quiz using service
    const { quiz, metrics } = await generateQuiz(
      quizTopic,
      quizDescription,
      numberOfQuestions,
      quizTags!
    );

    const mockUserId = "15bad7bc-8e09-48d8-aa43-4018a7e9d104";
    // Log usage
    const usage = await db.insert(userUsageData).values({
      userId: mockUserId,
      promptTokens: metrics.usage.promptTokens,
      completionTokens: metrics.usage.completionTokens,
      totalTokens: metrics.usage.totalTokens,
      responseTimeTaken: metrics.durationInSeconds,
      usedModel: process.env.GPT_MODEL!,
      countQuestions: numberOfQuestions,
      prompt: generateQuizPrompt(
        quizTopic,
        quizDescription,
        numberOfQuestions,
        quizTags
      ),
      language: result.data.language,
    });

    // Translate if needed
    if (result.data.language !== supportedLanguages.Enum.en) {
      const translateClient = createTranslateClient();
      const translatedQuiz = await translateQuiz(
        quiz,
        language,
        translateClient
      );
      return NextResponse.json({ rawQuestions: translatedQuiz });
    }

    return NextResponse.json({
      rawQuestions: quiz,
    });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      {
        message: "An unexpected error occurred",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
