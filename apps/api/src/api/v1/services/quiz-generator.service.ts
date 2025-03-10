import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { quizSchema } from "../schemas/quiz.schemas";
import { generateQuizPrompt } from "./prompts";
import type { z } from "zod";
import { shuffle } from "lodash";

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
  quizDescription?: string,
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
      schemaName: "quizzes",
      schemaDescription: 'A quiz with multiple choice questions.',
      schema: quizSchema,
      prompt: generateQuizPrompt(
        quizTopic,
        quizDescription ?? "",
        numberOfQuestions,
        quizTags,
      ),
      maxTokens: 1024,
      presencePenalty: 0.5,
      system: `You are creating a quiz with multiple choice questions. 
        Each question MUST have exactly 4 options - no more, no less.
        The correct answer must exactly match one of the options.
        Include letters a), b), c), d) in the options or answers.
        Important: Always provide exactly 4 options for each question.`
    });

    // Add letters to options and correct answers
    const processedQuiz = {
      ...generatedQuiz.object,
      questions: generatedQuiz.object.questions.map((question) => {
        if (question.options.length !== 4) {
          throw new Error(
            `Question "${question.questionTitle}" does not have exactly 4 options`,
          );
        }

        // Create pairs of options and letters
        const optionPairs = question.options.map((opt, idx) => ({
          option: opt,
          letter: ["a", "b", "c", "d"][idx],
          isCorrect: opt === question.correctAnswer,
        }));

        // Shuffle the pairs together
        // uses Lodash (using a version of the Fisher-Yates shuffle)
        const shuffledPairs = shuffle(optionPairs);

        // Find the correct answer pair
        const correctPair = shuffledPairs.find((pair) => pair.isCorrect);
        if (!correctPair) {
          throw new Error(
            `Correct answer "${question.correctAnswer}" not found in options for question "${question.questionTitle}"`,
          );
        }

        return {
          ...question,
          options: shuffledPairs.map(
            (pair) => `${pair.letter}) ${pair.option}`,
          ),
          correctAnswer: `${correctPair.letter}) ${question.correctAnswer}`,
        };
      }),
    };

    const durationInSeconds = (performance.now() - startTime) / 1000;

    return {
      quiz: processedQuiz,
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