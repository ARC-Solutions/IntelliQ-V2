import { db } from "@/db/index";
import { NextResponse } from "next/server";
import { users } from "../../../../drizzle/schema";

export const GET = async () => {
  const result = await db
    .select({
      email: users.email,
    })
    .from(users);
  // going mad at this point
  return NextResponse.json(result);
};
