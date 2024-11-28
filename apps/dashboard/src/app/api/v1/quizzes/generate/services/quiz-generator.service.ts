import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { quizSchema } from "@/app/api/v1/schemas";
import { generateQuizPrompt } from "@/app/api/v1/prompts";
import { z } from "zod";

// Use the quiz schema to infer the type
type Quiz = z.infer<typeof quizSchema>;

export interface QuizGenerationResult {
  quiz: Quiz;
  metrics: {
    durationInSeconds: number;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

export async function generateQuiz(
  quizTopic: string,
  quizDescription: string,
  numberOfQuestions: number,
  quizTags: string[]
): Promise<QuizGenerationResult> {
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

  return {
    quiz: generatedQuiz.object,
    metrics: {
      durationInSeconds,
      usage: generatedQuiz.usage,
    },
  };
} 