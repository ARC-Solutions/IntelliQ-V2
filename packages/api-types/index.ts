import type { AppType as ApiAppType } from "../../apps/api/src";
import type { z } from "zod";
import type {
  roomSchema,
  roomResponseSchema,
  roomDetailsResponseSchema,
  roomSettingsResponseSchema,
  updateRoomSettingsSchema,
  createRoomSchema,
} from "../../apps/api/src/api/v1/schemas/room.schemas";
import type {
  quizSchema,
  quizGenerationRequestSchema,
  quizResponseSchema,
} from "../../apps/api/src/api/v1/schemas/quiz.schemas";

export type AppType = ApiAppType;

// Room types
export type RoomSchema = z.infer<typeof roomSchema>;
export type RoomResponse = z.infer<typeof roomResponseSchema>;
export type RoomDetailsResponse = z.infer<typeof roomDetailsResponseSchema>;
export type RoomSettingsResponse = z.infer<typeof roomSettingsResponseSchema>;
export type UpdateRoomSettings = z.infer<typeof updateRoomSettingsSchema>;
export type CreateRoom = z.infer<typeof createRoomSchema>;
export type QuizSchema = z.infer<typeof quizSchema>;
export type QuizGenerationRequest = z.infer<typeof quizGenerationRequestSchema>;
export type QuizResponse = z.infer<typeof quizResponseSchema>;
