import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import { getRequestContext } from "@cloudflare/next-on-pages";

neonConfig.fetchConnectionCache = true;

export const getDb = () => {
  const { env } = getRequestContext();
  const sql = neon(env.HYPERDRIVE.connectionString);
  const db = drizzle(sql);
  return db;
};
