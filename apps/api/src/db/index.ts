import { drizzle } from "drizzle-orm/postgres-js";
import { Context } from "hono";
import postgres from "postgres";

export const createDb = async (c: Context) => {
  const db = drizzle(postgres(c.env.HYPERDRIVE.connectionString));
  return db;
};
