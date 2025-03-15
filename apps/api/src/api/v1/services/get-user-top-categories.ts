import { userAnalysis } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import type { Context } from "hono";

import { createDb } from "@/db";

export async function getUserTopCategories(c: Context, userId: string) {
  const db = await createDb(c);

  const analysis = await db.query.userAnalysis.findFirst({
    where: eq(userAnalysis.userId, userId),
  });

  return (
    analysis?.generatedCategories
      ?.sort(
        (a, b) =>
          (b as { count: number }).count - (a as { count: number }).count,
      )
      .slice(0, 5) || []
  );
}
