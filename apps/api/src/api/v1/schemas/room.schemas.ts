import { z } from "zod";

export const roomSchema = z.object({
  roomCode: z.string().min(4, "Room code is required"),
});

export const roomResponseSchema = z.object({
  max_players: z.number(),
});

export const roomDetailsResponseSchema = z.object({
  id: z.string(),
  quiz_id: z.string().nullable(),
  host_id: z.string(),
  max_players: z.number(),
  num_questions: z.number(),
  code: z.string(),
  created_at: z.string(),
  ended_at: z.string().nullable(),
});

export type RoomResponse = z.infer<typeof roomResponseSchema>;
export type RoomDetailsResponse = z.infer<typeof roomDetailsResponseSchema>;
