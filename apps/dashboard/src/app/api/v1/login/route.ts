import { createClient } from "@/lib/supabase/supabase-server-side";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loginSchema } from "@/lib/validations/auth";

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
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
};
