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
});

export type RoomResponse = z.infer<typeof roomResponseSchema>;
export type RoomDetailsResponse = z.infer<typeof roomDetailsResponseSchema>;
