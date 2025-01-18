import { z } from "zod";
import { supportedLanguages } from "./common.schemas";

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

export const quizGenerationRequestSchema = z.object({
  quizTopic: z.string().min(1, "Quiz topic is required"),
  quizDescription: z.string().min(1, "Quiz description is required"),
  numberOfQuestions: z.coerce
    .number()
    .int()
    .min(1, "Must generate at least 1 question")
    .max(10, "Cannot generate more than 10 questions"),
  quizTags: z.preprocess(
    (val) => typeof val === 'string' ? val.split(',').map(tag => tag.trim()) : val,
    z.array(z.string())
  ),
  language: supportedLanguages.default(supportedLanguages.Enum.en),
});

