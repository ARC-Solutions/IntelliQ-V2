import { z } from "zod";
import { supportedLanguages, quizType } from "./common.schemas";

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

export const quizGenerationRequestSchema = z.discriminatedUnion("quizType", [
  z.object({
    quizType: z.literal(quizType.Enum.singleplayer),
    quizTopic: z.string().min(1, "Quiz topic is required"),
    quizDescription: z.string().min(1, "Quiz description is required"),
    numberOfQuestions: z.coerce
      .number()
      .int()
      .min(1, "Must generate at least 1 question")
      .max(10, "Cannot generate more than 10 questions"),
    quizTags: z.preprocess(
      (val) =>
        typeof val === "string" ? val.split(",").map((tag) => tag.trim()) : val,
      z.array(z.string())
    ),
    language: supportedLanguages.default(supportedLanguages.Enum.en),
  }),
  z.object({
    quizType: z.literal(quizType.Enum.multiplayer),
    quizTopic: z.string().min(1, "Quiz topic is required"),
    numberOfQuestions: z.coerce
      .number()
      .int()
      .min(1, "Must generate at least 1 question")
      .max(10, "Cannot generate more than 10 questions"),
    language: supportedLanguages.default(supportedLanguages.Enum.en),
  }),
]);

export const quizResponseSchema = z.object({
  quiz: quizSchema,
});
