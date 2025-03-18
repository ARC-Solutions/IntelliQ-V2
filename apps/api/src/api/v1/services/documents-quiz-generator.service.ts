import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import type { z } from "zod";
import { OPTION_PREFIXES, documentsQuizSchema } from "../schemas/quiz.schemas";
import { generateQuizPromptDocument } from "./prompts";
// Use the quiz schema to infer the type
type Quiz = z.infer<typeof documentsQuizSchema>;

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

export async function generateQuizFromDocument(
  c: { env: { GPT_MODEL: string; OPENAI_API_KEY: string } },
  documentContent: string,
  numberOfQuestions: number,
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
      schemaName: "document_quiz",
      schemaDescription:
        "A quiz with multiple-choice questions. Each question must have exactly 4 options.",
      schema: documentsQuizSchema,
      prompt: `${generateQuizPromptDocument(documentContent, numberOfQuestions)}
       
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
      presencePenalty: 0.5,
      system: `You are creating a quiz with multiple choice questions. 
        Each question MUST have exactly 4 options - no more, no less.
        The correct answer must exactly match one of the options.
        Include letters a), b), c), d) in the options or answers.
        Important: Always provide exactly 4 options for each question.`,
    });

    const validatedQuiz = documentsQuizSchema.parse(generatedQuiz.object);

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
        documentContent,
        numberOfQuestions,
      },
    };

    console.error("Quiz generation error:", JSON.stringify(errorDetails));

    throw new Error(JSON.stringify(errorDetails), { cause: error });
  }
}
