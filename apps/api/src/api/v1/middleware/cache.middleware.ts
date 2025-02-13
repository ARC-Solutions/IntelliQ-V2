import { getUserCacheVersion } from "../../../utils/kv-user-version";
import { Context, MiddlewareHandler } from "hono";
import { cache } from "hono/cache";

export const SHORT_CACHE = 30; // 30 seconds
export const MEDIUM_CACHE = 150; // 2.5 minutes
export const LONG_CACHE = 1800; // 30 minutes

export const createCacheMiddleware = (
  cacheName: string,
  maxAge: number = SHORT_CACHE
): MiddlewareHandler<{ Bindings: CloudflareEnv }> => {
  return cache({
    cacheName,
    cacheControl: `public, max-age=${maxAge}`,
    vary: ["Accept-Encoding", "Accept", "Authorization"],
    wait: true,
    keyGenerator: async (c: Context<{ Bindings: CloudflareEnv }>) => {
      // 1. Identify user via Supabase or some auth
      const supabase = c.get("supabase");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // If no user, fallback to anonymous with a static version=1
      if (!user) {
        return `${c.req.url}&v=1#user=anonymous`;
      }

      // 2. Get version from KV
      const kv = c.env.IntelliQ_CACHE_VERSION;
      const userVersion = await getUserCacheVersion(kv, user.id);

      // 3. Create cache key by appending version and user
      const separator = c.req.url.includes("?") ? "&" : "?";
      const cacheKey = `${c.req.url}${separator}v=${userVersion}#user=${user.id}`;

      return cacheKey;
    },
  });
};
