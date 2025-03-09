import type { createDb } from "../../../db/index";
import { userAnalysis } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";

export async function updateUserTagStats(
  db: Awaited<ReturnType<typeof createDb>>,
  userId: string,
  newTags: string[],
  newCategories: string[],
) {
  const existingAnalysis = await db.query.userAnalysis.findFirst({
    where: eq(userAnalysis.userId, userId),
  });

  // Handle tags
  const tagCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  if (existingAnalysis?.generatedTags) {
    for (const tagObj of existingAnalysis.generatedTags as {
      tag: string;
      count: number;
    }[]) {
      tagCounts.set(tagObj.tag, tagObj.count);
    }
  }

  if (existingAnalysis?.generatedCategories) {
    for (const catObj of existingAnalysis.generatedCategories as {
      category: string;
      count: number;
    }[]) {
      categoryCounts.set(catObj.category, catObj.count);
    }
  }

  // Update counts
  for (const tag of newTags) {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  }

  for (const category of newCategories) {
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  }

  // Convert to sorted arrays
  const updatedTagStats = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  const updatedCategoryStats = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  if (existingAnalysis) {
    // Upsert to database
    await db
      .update(userAnalysis)
      .set({
        generatedTags: updatedTagStats,
        generatedCategories: updatedCategoryStats,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userAnalysis.userId, userId));
  } else {
    await db.insert(userAnalysis).values({
      userId,
      generatedTags: updatedTagStats,
      generatedCategories: updatedCategoryStats,
      userTags: [],
      updatedAt: new Date().toISOString(),
    });
  }
}
