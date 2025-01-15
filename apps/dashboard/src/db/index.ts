import { drizzle } from "drizzle-orm/neon-http";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const getDb = () => {
  const { env } = getRequestContext();
  return drizzle(env.HYPERDRIVE.connectionString);
};
