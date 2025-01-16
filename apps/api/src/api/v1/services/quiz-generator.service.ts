import { createOpenAI, openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { quizSchema } from "../schemas";
import { generateQuizPrompt } from "../prompts";
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
  c: { env: { GPT_MODEL: string, OPENAI_API_KEY: string } },
  quizTopic: string,
  quizDescription: string,
  numberOfQuestions: number,
  quizTags: string[]
): Promise<QuizGenerationResult> {
  const GPT_MODEL = c.env.GPT_MODEL;
  const startTime = performance.now();
  const openai = createOpenAI({
    apiKey: c.env.OPENAI_API_KEY,
  });

  const generatedQuiz = await generateObject({
    model: openai(GPT_MODEL, {
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

  const durationInSeconds = (performance.now() - startTime) / 1000;

  return {
    quiz: generatedQuiz.object,
    metrics: {
      durationInSeconds,
      usage: generatedQuiz.usage,
    },
  };
}
