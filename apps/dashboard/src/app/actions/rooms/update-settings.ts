"use server";

import { actionClient } from "../safe-action";
import {
  updateRoomSettingsSchema,
} from "../schemas/update-room-settings-schema";
import { db } from "@/db";
import { rooms } from "@drizzle/schema";
import { eq } from "drizzle-orm";

export const updateRoomSettings = actionClient
  .schema(updateRoomSettingsSchema)
  .action(
    async ({
      parsedInput: { roomCode, type, value },
    }) => {
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
