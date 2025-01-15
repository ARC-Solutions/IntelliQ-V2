import { createClient } from "@/lib/supabase/supabase-server-side";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loginSchema } from "@/lib/validations/auth";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export const POST = async (request: NextRequest) => {
  try {
    const { email, password } = loginSchema.parse(await request.json());
    const supabase = createClient();
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return NextResponse.json({ message: "User logged in successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error instanceof Error ? error.message : "Unknown error" },
        { status: 400 }
      );
    }

    console.error("Login error:", error);
    return NextResponse.json(
      {
        message: "An unexpected error occurred",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
