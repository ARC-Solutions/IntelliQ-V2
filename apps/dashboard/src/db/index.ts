import { drizzle } from "drizzle-orm/postgres-js";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const getDb = () => {
  const { env } = getRequestContext();
  const db = drizzle(env.HYPERDRIVE.connectionString);
  return db;
};
