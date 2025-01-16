import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { rooms } from "@drizzle/schema";
import { roomSchema, roomResponseSchema } from "@/app/api/v1/schemas";
import { z } from "zod";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export const GET = async (
  request: NextRequest,
  { params }: { params: { roomCode: string } }
) => {
  const startTime = performance.now();
  try {
    console.log("Starting validation...");
    const validationStart = performance.now();
    const validatedParams = roomSchema.parse(params);
    console.log(`Validation took: ${performance.now() - validationStart}ms`);

    console.log("Starting DB query...");
    const queryStart = performance.now();
    const db = getDb();
    const room = await db
      .select({ max_players: rooms.maxPlayers })
      .from(rooms)
      .where(eq(rooms.code, validatedParams.roomCode))
      .limit(1);
    console.log(`DB query took: ${performance.now() - queryStart}ms`);

    if (!room[0]) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    console.log("Starting response validation...");
    const responseValidationStart = performance.now();
    const validatedResponse = roomResponseSchema.parse(room[0]);
    console.log(
      `Response validation took: ${
        performance.now() - responseValidationStart
      }ms`
    );

    console.log(`Total time: ${performance.now() - startTime}ms`);
    return NextResponse.json(validatedResponse);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("Full error object:", JSON.stringify(error, null, 2));

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    throw error;
  }
};
