import { z } from "zod";
import { supportedLanguages } from "./common.schemas";

export const roomSchema = z.object({
  roomCode: z.string().min(4, "Room code is required"),
});

export const roomResponseSchema = z.object({
  maxPlayers: z.number(),
});

export const roomDetailsResponseSchema = z.object({
  // UUIDs or strings
  id: z.string(),
  hostId: z.string(),

  // Numbers
  maxPlayers: z.number(),
  numQuestions: z.number(),
  timeLimit: z.number(),

  // Strings
  code: z.string(),
  topic: z.string().nullable(),

  // Enums
  language: supportedLanguages,

  // Dates or strings
  // If `createdAt` is just a string in the response, use z.string()
  // If you prefer an actual Date object, you'd do z.coerce.date()
  createdAt: z.string(),

  // endedAt can be null
  endedAt: z.string().nullable(),
});

export const updateRoomSettingsSchema = z.object({
  type: z.enum([
    "numQuestions",
    "timeLimit",
    "topic",
    "showAnswers",
    "maxPlayers",
    "language",
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
  hostId: roomDetailsResponseSchema.shape.hostId,
  maxPlayers: roomDetailsResponseSchema.shape.maxPlayers,
  numQuestions: roomDetailsResponseSchema.shape.numQuestions,
  createdAt: roomDetailsResponseSchema.shape.createdAt,
  endedAt: roomDetailsResponseSchema.shape.endedAt,
  timeLimit: roomDetailsResponseSchema.shape.timeLimit,
});

export type RoomResponse = z.infer<typeof roomResponseSchema>;
export type RoomDetailsResponse = z.infer<typeof roomDetailsResponseSchema>;
