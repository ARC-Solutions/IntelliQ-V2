import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

export const db = drizzle(postgres(process.env.DATABASE_URL!));
