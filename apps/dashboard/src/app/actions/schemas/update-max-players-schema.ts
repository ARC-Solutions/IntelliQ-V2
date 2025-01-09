import { z } from "zod";
import {roomSchema} from "@/app/api/v1/schemas"

export const updateMaxPlayersSchema = z.object({
    maxPlayers: z.number().min(2).max(10),
    roomCode: roomSchema.shape.roomCode,
});
