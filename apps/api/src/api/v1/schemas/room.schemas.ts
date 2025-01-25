import { z } from "zod";

export const roomSchema = z.object({
  roomCode: z.string().min(4, "Room code is required"),
});

export const roomResponseSchema = z.object({
  max_players: z.number(),
});

export const roomDetailsResponseSchema = z.object({
  id: z.string(),
  quizId: z.string().nullable(),
  hostId: z.string(),
  maxPlayers: z.number(),
  numQuestions: z.number(),
  code: z.string(),
  createdAt: z.string(),
  endedAt: z.string().nullable(),
  timeLimit: z.number(),
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

export const updateRoomSettingsSchema = z.object({
  type: z.enum(["numQuestions", "timeLimit", "topic", "showAnswers", "maxPlayers"]),
  value: z.union([z.number(), z.string(), z.boolean()]),
});

export const createRoomSchema = z.object({
  code: roomSchema.shape.roomCode,
  hostId: roomDetailsResponseSchema.shape.hostId,
  maxPlayers: roomDetailsResponseSchema.shape.maxPlayers,
  numQuestions: roomDetailsResponseSchema.shape.numQuestions,
  timeLimit: roomDetailsResponseSchema.shape.timeLimit,
});

export type RoomResponse = z.infer<typeof roomResponseSchema>;
export type RoomDetailsResponse = z.infer<typeof roomDetailsResponseSchema>;
