import { getRequestContext } from "@cloudflare/next-on-pages";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

export const getDb = () => {
  const { env } = getRequestContext();
  const db = drizzle(postgres(process.env.DATABASE_URL!));
  return db;
};
