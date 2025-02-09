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
  quizDescription: z.string().min(1, "Quiz description is required").optional(),
  numberOfQuestions: z.coerce
    .number()
    .int()
    .min(1, "Must generate at least 1 question")
    .max(10, "Cannot generate more than 10 questions"),
  quizTags: z
    .preprocess(
      (val) =>
        typeof val === "string" ? val.split(",").map((tag) => tag.trim()) : val,
      z.array(z.string())
    )
    .optional(),
  language: supportedLanguages.default(supportedLanguages.Enum.en),
  quizType: z.enum(["singleplayer", "multiplayer", "document", "random"]),
});

export const quizResponseSchema = z.object({
  quiz: quizSchema,
});

export const quizSubmissionMultiplayerRequestSchema = z.object({
  quizTitle: z.string(),
  language: supportedLanguages,
  userScore: z.number().positive(),
  topics: z.array(z.string()),
  questions: z.array(
    z.object({
      text: z.string(),
      userAnswer: z.string(),
      correctAnswer: z.string(),
      timeTaken: z.number().positive(),
      options: z.array(z.string()),
    })
  ),
});

// export const quizSubmissionMultiplayerRequestSchema = z.object({
//   quizTitle: z.string(),
//   type: quizType,
//   language: supportedLanguages,
//   documentId: z.string().uuid(),
//   passingScore: z.number().positive(),
//   userScore: z.number().positive(),
//   totalCount: z.number().positive(),
//   topics: z.array(z.string()),
//   description: z.string(),
//   questions: z.array(
//     z.object({
//       text: z.string(),
//       userAnswer: z.string(),
//       correctAnswer: z.string(),
//       timeTaken: z.number().positive(),
//       options: z.array(z.string()),
//     })
//   ),
// });
