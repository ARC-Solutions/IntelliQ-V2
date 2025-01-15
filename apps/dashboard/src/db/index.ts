import { drizzle } from "drizzle-orm/neon-serverless";
import { getRequestContext } from "@cloudflare/next-on-pages";

// create a function to get the appropriate database connection
export function getDb() {
    // try to get CF pages context first
    const { env } = getRequestContext();
    return drizzle(env.HYPERDRIVE.connectionString);
}

// export db instance
export const db = getDb();
