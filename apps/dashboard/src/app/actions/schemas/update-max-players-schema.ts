import { z } from "zod";
import {roomSchema} from "@/app/actions/schemas/old-v1-api-schema"

export const updateMaxPlayersSchema = z.object({
    maxPlayers: z.number().min(2).max(10),
    roomCode: roomSchema.shape.roomCode,
});
