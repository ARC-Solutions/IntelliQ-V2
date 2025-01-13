"use server";

import { edgeActionClient } from '../safe-action';
import { updateMaxPlayersSchema } from "../schemas/update-max-players-schema";
import { getEdgeDb } from "@/db";
import { rooms } from "@drizzle/schema";
import { eq } from "drizzle-orm";
import { Env } from "@/db";

export const updateRoomMaxPlayers = edgeActionClient
  .schema(updateMaxPlayersSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { maxPlayers, roomCode } = parsedInput;
    const db = getEdgeDb(ctx.env! as Env);
    const updated = await db
      .update(rooms)
      .set({ maxPlayers })
      .where(eq(rooms.code, roomCode))
      .returning({ maxPlayers: rooms.maxPlayers });

    if (!updated[0]) throw new Error("Failed to update room capacity");

    return { maxPlayers: updated[0].maxPlayers };
  });
