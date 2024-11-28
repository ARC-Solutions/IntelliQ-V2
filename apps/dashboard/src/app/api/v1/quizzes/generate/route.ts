import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import {
  quizGenerationRequestSchema,
  quizSchema,
  supportedLanguages,
} from "@/app/api/v1/schemas";
import { generateQuizPrompt } from "@/app/api/v1/prompts";
import { createClient } from "@/lib/supabase/supabase-server-side";
import { db } from "@/db";
import { userUsageData } from "@drizzle/schema";
import { createTranslateClient, translateQuiz } from "./utils/translator";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(2, "30 s"),
});

export const GET = async (request: NextRequest) => {
  try {
    // Get user
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { success } = await ratelimit.limit(user?.id!);

    if (!success) {
      console.log("Unable to process at this time");
      return NextResponse.json({ error: "Quota exceeded" }, { status: 429 });
    }

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

    // Generate quiz
    const GPT_MODEL = process.env.GPT_MODEL;
    const startTime = process.hrtime();
    const generatedQuiz = await generateObject({
      model: openai(GPT_MODEL!, {
        structuredOutputs: true,
      }),
      schemaName: "quizzes",
      schemaDescription: "A quiz.",
      schema: quizSchema,
      prompt: generateQuizPrompt(
        quizTopic,
        quizDescription,
        numberOfQuestions,
        quizTags
      ),
      maxTokens: 1024,
    });
    const endTime = process.hrtime(startTime);
    const durationInSeconds = endTime[0] + endTime[1] / 1e9;

    // Log usage
    const usage = await db.insert(userUsageData).values({
      userId: user?.id!,
      promptTokens: generatedQuiz.usage.promptTokens,
      completionTokens: generatedQuiz.usage.completionTokens,
      totalTokens: generatedQuiz.usage.totalTokens,
      responseTimeTaken: durationInSeconds,
      usedModel: GPT_MODEL!,
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
        generatedQuiz.object,
        language,
        translateClient
      );
      return NextResponse.json({ rawQuestions: translatedQuiz });
    }

    return NextResponse.json({
      rawQuestions: generatedQuiz.object,
    });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
