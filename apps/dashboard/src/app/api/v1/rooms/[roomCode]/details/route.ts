import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rooms } from "@drizzle/schema";
import { eq } from "drizzle-orm";
import { roomSchema, roomDetailsResponseSchema } from "@/app/api/v1/schemas";
import { z } from "zod";

export const dynamic = "force-dynamic";

export const GET = async (
    request: NextRequest,
  { params }: { params: { roomCode: string } }
) => {
  try {
    // Validate route params
    const validatedParams = roomSchema.parse(params);

    const room = await db
        .select({
            id: rooms.id,
            quiz_id: rooms.quizId,
            host_id: rooms.hostId,
            max_players: rooms.maxPlayers,
            num_questions: rooms.numQuestions,
            code: rooms.code,
            created_at: rooms.createdAt,
            ended_at: rooms.endedAt,
      })
      .from(rooms)
      .where(eq(rooms.code, validatedParams.roomCode))
      .limit(1);

    if (!room[0]) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Validate response data
    const validatedResponse = roomDetailsResponseSchema.parse(room[0]);
    return NextResponse.json(validatedResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    throw error;
  }
};