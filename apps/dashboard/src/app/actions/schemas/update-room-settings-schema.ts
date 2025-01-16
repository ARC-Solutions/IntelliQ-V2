import { z } from "zod";
import { roomSchema } from "@/app/actions/schemas/old-v1-api-schema";

export const updateRoomSettingsSchema = z.object({
  roomCode: roomSchema.shape.roomCode,
  type: z.enum(['numQuestions', 'maxPlayers']),
  value: z.number().int().positive(),
});
