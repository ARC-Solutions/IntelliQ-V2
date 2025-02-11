import { Context, MiddlewareHandler } from "hono";
import { cache } from "hono/cache";

export const SHORT_CACHE = 30; // 30 seconds
export const MEDIUM_CACHE = 150; // 2.5 minutes
export const LONG_CACHE = 1800; // 30 minutes

export const createCacheMiddleware = (
  cacheName: string,
  maxAge: number = SHORT_CACHE
): MiddlewareHandler => {
  return cache({
    cacheName,
    cacheControl: `public, max-age=${maxAge}`,
    vary: ["Accept-Encoding", "Accept", "Authorization"],
    wait: true,
    keyGenerator: async (c: Context) => {
      // Include auth context in cache key to prevent sharing between users
      const supabase = c.get("supabase");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return `${c.req.url}#user=${user?.id ?? "anonymous"}`;
    },
  });
};
