import { z } from "zod";

export const quizSchema = z.object({
  quizTitle: z.string(),
  questions: z.array(
    z.object({
      questionTitle: z.string(),
      text: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.string(),
    })
  ),
});

// EN, DE, FR, ES, IT because most of our users are from these countries
export const supportedLanguages = z.enum(["en", "de", "fr", "es", "it", "ja", "ro", "sr", "tl", "pl"]);
export const quizGenerationRequestSchema = z.object({
  quizTopic: z.string().min(1, "Quiz topic is required"),
  quizDescription: z.string().min(1, "Quiz description is required"),
  numberOfQuestions: z.coerce
    .number()
    .int()
    .min(1, "Must generate at least 1 question")
    .max(10, "Cannot generate more than 10 questions"),
  quizTags: z
    .string()
    .optional()
    .transform((tags) =>
      tags ? tags.split(",").map((tag) => tag.trim()) : undefined
    ),
  language: supportedLanguages.default(supportedLanguages.Enum.en),
});

export const roomSchema = z.object({
  roomCode: z.string().min(4, "Room code is required"),
});

export const roomResponseSchema = z.object({
  max_players: z.number(),
});
