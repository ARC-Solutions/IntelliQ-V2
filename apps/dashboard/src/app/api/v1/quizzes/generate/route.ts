import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { quizGenerationRequestSchema, quizSchema } from "@/app/api/v1/schemas";
import { generateQuizPrompt } from "@/app/api/v1/prompts";

export const GET = async (request: NextRequest) => {
  try {
    // Parse and validate query parameters
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
      model: openai("gpt-4o-mini", {
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
    });
    const endTime = process.hrtime(startTime);
    const durationInSeconds = endTime[0] + endTime[1] / 1e9;

    return NextResponse.json({
      rawQuestions: generatedQuiz.object,
      durationInSeconds,
    });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
