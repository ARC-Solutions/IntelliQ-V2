import { z } from "zod";

export const roomSchema = z.object({
  roomCode: z.string().min(4, "Room code is required"),
});

export const roomResponseSchema = z.object({
  max_players: z.number(),
});

export const roomDetailsResponseSchema = z.object({
  id: z.string().uuid(),
  quizId: z.string().uuid().nullable(),
  hostId: z.string().uuid(),
  maxPlayers: z.number().int().positive(),
  numQuestions: z.number().int().positive(),
  code: z.string(),
  createdAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable(),
  timeLimit: z.number().int().positive(),
  topic: z.string().nullable(),
});

export const updateRoomSettingsSchema = z.object({
  type: z.enum([
    "numQuestions",
    "timeLimit",
    "topic",
    "showAnswers",
    "maxPlayers",
  ]),
  value: z.union([z.number(), z.string(), z.boolean()]),
});

export const createRoomSchema = z.object({
  code: roomSchema.shape.roomCode,
  hostId: roomDetailsResponseSchema.shape.hostId,
  maxPlayers: roomDetailsResponseSchema.shape.maxPlayers,
  numQuestions: roomDetailsResponseSchema.shape.numQuestions,
  timeLimit: roomDetailsResponseSchema.shape.timeLimit,
});

export const createRoomResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  host_id: z.string().uuid(),
  max_players: z.number().int().positive(),
  num_questions: z.number().int().positive(),
  time_limit: z.number().int().positive(),
  created_at: z.string().datetime(),
});

export const roomSettingsResponseSchema = z.object({
  code: roomSchema.shape.roomCode,
  id: roomDetailsResponseSchema.shape.id,
  quizId: roomDetailsResponseSchema.shape.quizId,
  hostId: roomDetailsResponseSchema.shape.hostId,
  maxPlayers: roomDetailsResponseSchema.shape.maxPlayers,
  numQuestions: roomDetailsResponseSchema.shape.numQuestions,
  createdAt: roomDetailsResponseSchema.shape.createdAt,
  endedAt: roomDetailsResponseSchema.shape.endedAt,
  timeLimit: roomDetailsResponseSchema.shape.timeLimit,
});

export type RoomResponse = z.infer<typeof roomResponseSchema>;
export type RoomDetailsResponse = z.infer<typeof roomDetailsResponseSchema>;
