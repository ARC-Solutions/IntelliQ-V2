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
  quiz: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    topic: z.array(z.string()).nullable(),
    tags: z.array(z.string()).nullable(),
    passingScore: z.number().nullable(),
    documentId: z.number().nullable(),
    type: z.string(),
    createdAt: z.string(),
    language: z.string(),
    userScore: z.number().nullable(),
    correctAnswersCount: z.number().nullable(),
    questionsCount: z.number(),
    roomId: z.string().uuid().nullable(),
    totalTimeTaken: z.number().nullable(),
    passed: z.boolean().nullable(),
    createdBy: z.string().optional(),
  }),
  shareId: z.string().uuid(),
  shareUrl: z.string().url(),
  isPublic: z.boolean(),
  isAnonymous: z.boolean(),
  type: z.string(),
});

// GET /api/v1/share/UUID
export const getShareSingleplayerQuizResponseSchema =
  updateShareSingleplayerQuizResponseSchema.extend({
    quiz: updateShareSingleplayerQuizResponseSchema.shape.quiz.extend({
      // TODO: this is just so that it works for the Launch, make better
      generatedTags: z.array(z.string()).optional().nullable(),
      generatedCategories: z.array(z.string()).optional().nullable(),
      embedding: z.array(z.number()).optional().nullable(),
    }),
    multiplayerSubmission: z
      .object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
        quizId: z.string().uuid(),
        roomId: z.string().uuid(),
        userScore: z.number(),
        correctAnswersCount: z.number(),
        createdAt: z.string(),
      })
      // So is this
      .optional().nullable(),
  });
