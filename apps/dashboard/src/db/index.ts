import { drizzle } from "drizzle-orm/neon-serverless";

export const getDb = () => {
  const db = drizzle(process.env.DATABASE_URL!);
  return db;
};
