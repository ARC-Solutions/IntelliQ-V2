import { drizzle } from "drizzle-orm/neon-serverless";

export interface Env {
    HYPERDRIVE: Hyperdrive;
}

export const getEdgeDb = (env: Env) => {
    const db = drizzle(env.HYPERDRIVE.connectionString);
    return db;
};