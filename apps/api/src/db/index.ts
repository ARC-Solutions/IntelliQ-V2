import { drizzle } from "drizzle-orm/postgres-js";
import { Context } from "hono";
import postgres from "postgres";

export const createDb = async (c: Context) => {
  const connectionString =
    c.env.ENVIRONMENT === "development"
      ? c.env.DATABASE_URL
      : c.env.HYPERDRIVE.connectionString;
  console.log("connectionString", connectionString);
  const db = drizzle(postgres(connectionString));
  return db;
};
