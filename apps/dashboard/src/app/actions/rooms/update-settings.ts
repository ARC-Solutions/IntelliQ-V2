"use server";

import { edgeActionClient } from "../safe-action";
import {
  updateRoomSettingsSchema,
} from "../schemas/update-room-settings-schema";
import { getEdgeDb } from "@/db";
import { rooms } from "@drizzle/schema";
import { eq } from "drizzle-orm";
import { Env } from "@/db";

export const updateRoomSettings = edgeActionClient
  .schema(updateRoomSettingsSchema)
  .action(
    async ({ parsedInput, ctx }) => {
      const { roomCode, type, value } = parsedInput;
      const db = getEdgeDb(ctx.env! as Env);
      const updated = await db
        .update(rooms)
        .set({ [type]: value })
        .where(eq(rooms.code, roomCode))
        .returning({
          code: rooms.code,
          id: rooms.id,
          quizId: rooms.quizId,
          hostId: rooms.hostId,
          maxPlayers: rooms.maxPlayers,
          numQuestions: rooms.numQuestions,
          createdAt: rooms.createdAt,
          endedAt: rooms.endedAt,
        });

      if (!updated[0]) throw new Error("Failed to update room capacity");

      return updated[0];
    }
  );
