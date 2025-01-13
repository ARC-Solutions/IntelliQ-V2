import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { rooms } from "@drizzle/schema";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export interface Env {
  HYPERDRIVE: Hyperdrive;
}

export const GET = async (
  request: NextRequest,
  context: { params: { roomCode: string }; env: Env }
) => {
  try {
    const db = drizzle(context.env.HYPERDRIVE.connectionString);

    const room = await db
      .select({
        max_players: rooms.maxPlayers,
      })
      .from(rooms)
      .where(eq(rooms.code, context.params.roomCode))
      .limit(1);

    if (!room[0]) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    return Response.json(room[0]);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
};
