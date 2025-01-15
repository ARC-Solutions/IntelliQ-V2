import { drizzle } from "drizzle-orm/neon-serverless";
import { getRequestContext } from "@cloudflare/next-on-pages";

// create a function to get the appropriate database connection
export async function getDb() {
    // try to get CF pages context first
    const HYPERDRIVE = getRequestContext().env.HYPERDRIVE;
    return drizzle(HYPERDRIVE.connectionString);
}

// export db instance
export const db = getDb();
