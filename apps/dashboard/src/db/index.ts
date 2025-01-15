import { drizzle } from "drizzle-orm/neon-serverless";
import { getRequestContext } from "@cloudflare/next-on-pages";

const { env, cf, ctx } = getRequestContext();
export const db = drizzle(env.HYPERDRIVE.connectionString);
