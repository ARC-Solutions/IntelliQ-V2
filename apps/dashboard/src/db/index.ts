import { drizzle } from "drizzle-orm/neon-serverless";
import { getRequestContext } from "@cloudflare/next-on-pages";
import ws from "ws";

export const getDb = () => {
  const { env } = getRequestContext();
  const db = drizzle({ connection: env.HYPERDRIVE.connectionString, ws: ws });
  return db;
};
