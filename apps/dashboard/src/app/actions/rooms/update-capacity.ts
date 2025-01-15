"use server";

import { actionClient } from "../safe-action";
import { updateMaxPlayersSchema } from "../schemas/update-max-players-schema";
import { getDb } from "@/db";
import { rooms } from "@drizzle/schema";
import { eq } from "drizzle-orm";

export const updateRoomMaxPlayers = actionClient
  .schema(updateMaxPlayersSchema)
  .action(async ({ parsedInput: { maxPlayers, roomCode } }) => {
    const db = getDb(); // init db with CF-Hyperdrive binding
    const updated = await db
      .update(rooms)
      .set({ maxPlayers })
      .where(eq(rooms.code, roomCode))
        .returning({ maxPlayers: rooms.maxPlayers });

    if (!updated[0]) throw new Error("Failed to update room capacity");

    return { maxPlayers: updated[0].maxPlayers };
  });