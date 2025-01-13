import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { createClient } from "@/lib/supabase/supabase-server-side";
import { User } from '@supabase/supabase-js';
import { Env } from "@/db";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(2, "30 s"),
});

export const withAuth = (
  handler: (
    req: NextRequest,
    user: User,
    ctx: { env: Env }
  ) => Promise<Response>
) => {
  return async (
    req: NextRequest,
    ctx: { params: any; env: Env }
  ): Promise<Response> => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Rate limiting
      const { success } = await ratelimit.limit(user?.id!);
      if (!success) {
        return NextResponse.json({ error: "Quota exceeded" }, { status: 429 });
      }

      return handler(req, user, { env: ctx.env });
    } catch (error) {
      console.error("API Error:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
};
