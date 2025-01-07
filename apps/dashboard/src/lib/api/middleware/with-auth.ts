import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { createClient } from "@/lib/supabase/supabase-server-side";
import { User } from '@supabase/supabase-js';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(2, "30 s"),
});

type AuthenticatedHandler<TParams = Record<string, string>> = (
  request: NextRequest,
  user: User,
  context: { params: TParams }
) => Promise<NextResponse>;

export const withAuth = <TParams = Record<string, string>>(
  handler: AuthenticatedHandler<TParams>
) => {
  return async (request: NextRequest, context: { params: TParams }) => {
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

      return handler(request, user, context);
    } catch (error) {
      console.error("API Error:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
};
