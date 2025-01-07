import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabase-server-side";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { rooms } from "@drizzle/schema";
import { roomSchema, roomResponseSchema } from "@/app/api/v1/schemas";
import { z } from "zod";
import { withAuth } from "@/lib/api/middleware/with-auth";
import { User } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const GET = withAuth(async (
  request: NextRequest,
  user: User,
  { params }: { params: { roomCode: string } }
) => {
  const validatedParams = roomSchema.parse(params);
  
  const room = await db
    .select({ max_players: rooms.maxPlayers })
    .from(rooms)
    .where(eq(rooms.code, validatedParams.roomCode))
    .limit(1);

  const validatedResponse = roomResponseSchema.parse(room[0]);
  return NextResponse.json(validatedResponse);
});