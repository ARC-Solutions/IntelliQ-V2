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

// POST /api/v1/share/multiplayer
export const shareMultiplayerQuizRequestSchema = z.object({
  quizId: z.string().uuid(),
  roomId: z.string().uuid(),
  isAnonymous: z.boolean(),
  isPublic: z.boolean(),
});

export const shareMultiplayerQuizResponseSchema = z.object({
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

// PATCH /api/v1/share/UUID
export const updateShareSingleplayerQuizRequestSchemaParam = z.object({
  shareId: z.string().uuid(),
});

export const updateShareSingleplayerQuizRequestSchema = z.object({
  isAnonymous: z.boolean(),
  isPublic: z.boolean(),
});

export const updateShareSingleplayerQuizResponseSchema = z.object({
  shareId: z.string().uuid(),
  shareUrl: z.string().url(),
  isAnonymous: z.boolean(),
  isPublic: z.boolean(),
  type: z.string(),
  quiz: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    topic: z.array(z.string()),
    tags: z.array(z.string()).nullable(),
    passingScore: z.number().nullable(),
    documentId: z.string().uuid().nullable(),
    type: z.string(),
    createdAt: z.string(),
    language: z.string(),
    userScore: z.number().nullable(),
    correctAnswersCount: z.number().nullable(),
    totalTimeTaken: z.number().nullable(),
    passed: z.boolean().nullable(),
    createdBy: z.string().optional(), 
    questionsCount: z.number(),
    roomId: z.string().uuid().nullable(),
  }),
});

// GET /api/v1/share/UUID
export const getShareSingleplayerQuizResponseSchema =
  updateShareSingleplayerQuizResponseSchema.extend({
    quiz: updateShareSingleplayerQuizResponseSchema.shape.quiz.extend({
      createdBy: z.string(),
    }),
  });
