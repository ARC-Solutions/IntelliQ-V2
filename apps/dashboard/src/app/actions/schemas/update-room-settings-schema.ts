import { z } from "zod";
import { roomSchema } from "@/app/api/v1/schemas";

export const updateRoomSettingsSchema = z.object({
  roomCode: roomSchema.shape.roomCode,
  type: z.enum(['numQuestions', 'maxPlayers']),
  value: z.number().int().positive(),
});
