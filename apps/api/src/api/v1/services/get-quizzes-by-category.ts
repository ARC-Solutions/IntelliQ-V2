import { createDb } from "../../../db/index";
import { quizzes } from "../../../../drizzle/schema";
import { sql } from "drizzle-orm";
import type { Context } from "hono";

export async function getQuizzesByCategory(c: Context, category: string) {
  const db = await createDb(c);

  return db.query.quizzes.findMany({
    where: sql`${quizzes.generatedCategories} @> ARRAY[${category}]::text[]`,
    with: {
      user: {
        columns: {
          name: true,
        },
      },
    },
  });
}
