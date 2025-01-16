import { generateQuizPrompt } from "@/app/api/v1/prompts";
import {
  quizGenerationRequestSchema,
  supportedLanguages,
} from "@/app/api/v1/schemas";
import { getDb } from "@/db";
import { userUsageData } from "@drizzle/schema";
import { NextRequest, NextResponse } from "next/server";
import { generateQuiz } from "./services/quiz-generator.service";
import { createTranslateClient, translateQuiz } from "./utils/translator";
import { withAuth } from "@/lib/api/middleware/with-auth";
import { User } from '@supabase/supabase-js';

export const runtime = "edge";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (request: NextRequest, user: User) => {
  try {
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

    // Log usage
    const db = getDb();
    const usage = await db.insert(userUsageData).values({
      userId: user?.id!,
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
});