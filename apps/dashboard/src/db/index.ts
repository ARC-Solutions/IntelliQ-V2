import { drizzle } from "drizzle-orm/neon-serverless";

export interface Env {
    HYPERDRIVE: Hyperdrive;
}

// For non-edge routes
export const db = drizzle(process.env.DATABASE_URL!);

// For edge routes
export const getEdgeDb = () => {
    // @ts-expect-error - Runtime binding
    const env = process.env.HYPERDRIVE?.connectionString;
    return drizzle(env);
};