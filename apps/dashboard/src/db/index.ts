import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

export const getDb = () => {
  const { env } = getRequestContext();
  const client = new Client({
    connectionString: env.HYPERDRIVE.connectionString,
  });
  return drizzle(client);
};
