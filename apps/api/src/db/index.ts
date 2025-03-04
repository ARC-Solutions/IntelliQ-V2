import * as schema from '../../drizzle/schema';
import * as relations from "../../drizzle/relations";
import { drizzle } from "drizzle-orm/postgres-js";
import { Context } from "hono";
import postgres from "postgres";

export const createDb = async (c: Context) => {
  const connectionString =
    c.env.ENVIRONMENT === "development"
      ? c.env.DATABASE_URL
      : c.env.HYPERDRIVE.connectionString;
  const db = drizzle(postgres(connectionString), {schema: {...schema, ...relations}});
  return db;
};
