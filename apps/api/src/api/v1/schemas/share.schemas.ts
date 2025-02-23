import { z } from "zod";

// POST /api/v1/share/singleplayer

export const shareSingleplayerQuizRequestSchema = z.object({
  quizId: z.string().uuid(),
  isAnonymous: z.boolean(),
  isPublic: z.boolean(),
});

export const shareSingleplayerQuizResponseSchema = z.object({
  shareId: z.string().uuid(),
  shareUrl: z.string().url(),
  isAnonymous: z.boolean(),
  isPublic: z.boolean(),
  type: z.string(),
  quiz: z.object({
    quizId: z.string().uuid(),
    title: z.string(),
  }),
});
