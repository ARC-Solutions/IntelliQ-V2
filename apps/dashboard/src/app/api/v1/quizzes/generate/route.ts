import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { quizGenerationRequestSchema, quizSchema } from "@/app/api/v1/schemas";
import { generateQuizPrompt } from "@/app/api/v1/prompts";
import { createClient } from "@/lib/supabase/supabase-server-side";
import { db } from "@/db";
import { userUsageData } from "@drizzle/schema";

export const GET = async (request: NextRequest) => {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const GPT_MODEL = process.env.GPT_MODEL;

    const { searchParams } = request.nextUrl;
    const result = quizGenerationRequestSchema.safeParse({
      quizTopic: searchParams.get("quizTopic"),
      quizDescription: searchParams.get("quizDescription"),
      numberOfQuestions: searchParams.get("numberOfQuestions"),
      quizTags: searchParams.get("quizTags"),
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

    const { quizTopic, quizDescription, numberOfQuestions, quizTags } =
      result.data;

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

    const usage = await db.insert(userUsageData).values({
      userId: user?.id!,
      promptTokens: generatedQuiz.usage.promptTokens,
      completionTokens: generatedQuiz.usage.completionTokens,
      totalTokens: generatedQuiz.usage.totalTokens,
      responseTimeTaken: durationInSeconds,
      usedModel: GPT_MODEL!,
      countQuestions: numberOfQuestions,
    });

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
