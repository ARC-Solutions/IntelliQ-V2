import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { quizSchema } from "../schemas/quiz.schemas";
import { generateQuizPrompt } from "./prompts";
import { z } from "zod";
import { OPTION_PREFIXES } from "../schemas/quiz.schemas";

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
  c: { env: { GPT_MODEL: string; OPENAI_API_KEY: string } },
  quizTopic: string,
  numberOfQuestions: number,
  quizTags?: string[],
  quizDescription?: string
): Promise<QuizGenerationResult> {
  try {
    const GPT_MODEL = c.env.GPT_MODEL;
    const startTime = performance.now();
    const openai = createOpenAI({
      apiKey: c.env.OPENAI_API_KEY,
    });

    const generatedQuiz = await generateObject({
      model: openai(GPT_MODEL, {
        structuredOutputs: true,
      }),
      schemaName: "quiz",
      schemaDescription: `A quiz with multiple-choice questions. Each question must have exactly 4 options.`,
      schema: quizSchema,
      prompt: `${generateQuizPrompt(
        quizTopic,
        quizDescription ?? "",
        numberOfQuestions,
        quizTags
      )}
      
      IMPORTANT: For each question's options array, you MUST:
      1. Include exactly 4 options
      2. Use these exact prefixes in order: ${JSON.stringify(OPTION_PREFIXES)}
      3. Format each option as: prefix + " " + option text
      
      Example format:
      "options": [
        "a) First option text",
        "b) Second option text",
        "c) Third option text",
        "d) Fourth option text"
      ]`,
      maxTokens: 1024,
    });

    // Additional validation to ensure the format is correct
    const validatedQuiz = quizSchema.parse(generatedQuiz.object);

    // Validate option prefixes
    for (const question of validatedQuiz.questions) {
      if (
        !question.options.every((opt, i) => opt.startsWith(OPTION_PREFIXES[i]))
      ) {
        throw new Error("Invalid option format");
      }
    }

    const durationInSeconds = (performance.now() - startTime) / 1000;

    return {
      quiz: validatedQuiz,
      metrics: {
        durationInSeconds,
        usage: generatedQuiz.usage,
      },
    };
  } catch (error) {
    // Create a structured error object
    const errorDetails = {
      name: error instanceof Error ? error.name : "Unknown Error",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
      context: {
        topic: quizTopic,
        description: quizDescription,
        numberOfQuestions,
        tags: quizTags,
      },
    };

    console.error("Quiz generation error:", JSON.stringify(errorDetails));

    throw new Error(JSON.stringify(errorDetails), { cause: error });
  }
}
