import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const getDb = () => {
  const { env } = getRequestContext();
  const queryClient = postgres(env.HYPERDRIVE.connectionString);
  const db = drizzle({ client: queryClient });
  return db;
};
