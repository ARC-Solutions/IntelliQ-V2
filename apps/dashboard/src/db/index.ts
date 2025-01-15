import { drizzle } from "drizzle-orm/neon-serverless";
import { getRequestContext } from "@cloudflare/next-on-pages";

// create a function to get the appropriate database connection
export function getDb() {
  try {
    // try to get CF pages context first
    const { env } = getRequestContext();
    return drizzle(env.HYPERDRIVE.connectionString);
  } catch {
    // fall back to process.env if not in CF pages environment
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not defined");
    }
    return drizzle(process.env.DATABASE_URL);
  }
}

// export db instance
export const db = getDb();
