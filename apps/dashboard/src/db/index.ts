import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const getDb = () => {
  const { env } = getRequestContext();
  const sql = neon(env.HYPERDRIVE.connectionString);
  return drizzle(sql);
};
