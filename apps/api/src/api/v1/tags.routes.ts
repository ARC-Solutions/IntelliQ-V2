import { createDb } from "../../db";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { z } from "zod";
import { getSupabase } from "./middleware/auth.middleware";
import { userAnalysis } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { createCacheMiddleware } from "./middleware/cache.middleware";
import { resolver } from "hono-openapi/zod";
const userAnalysisRoutes = new Hono<{ Bindings: CloudflareEnv }>()
  .get(
    "/top-tags",
    createCacheMiddleware("top-tags"),
    describeRoute({
      tags: ["User Analysis"],
      summary: "Get user's tag analysis",
      description:
        "Retrieve tag and category statistics for the authenticated user",
      validateResponse: true,
      responses: {
        200: {
          description: "User's tag analysis",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  tags: z.array(
                    z.object({
                      tag: z.string(),
                      count: z.number(),
                    }),
                  ),
                }),
              ),
            },
          },
        },
      },
    }),
    async (c) => {
      const db = await createDb(c);
      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const analysis = await db.query.userAnalysis.findFirst({
        where: eq(userAnalysis.userId, user!.id),
      });

      if (!analysis) {
        return c.json({
          tags: [],
        });
      }

      const topTags = (
        analysis.generatedTags! as Array<{
          tag: string;
          count: number;
        }>
      )
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return c.json({
        tags: topTags,
      });
    },
  )
  .get(
    "/top-categories",
    createCacheMiddleware("top-categories"),
    describeRoute({
      tags: ["User Analysis"],
      summary: "Get user's top categories",
      description:
        "Retrieve the most frequent categories for the authenticated user",
      validateResponse: true,
      responses: {
        200: {
          description: "User's top categories",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  categories: z.array(
                    z.object({
                      category: z.string(),
                      count: z.number(),
                    }),
                  ),
                }),
              ),
            },
          },
        },
      },
    }),
    async (c) => {
      const db = await createDb(c);
      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const analysis = await db.query.userAnalysis.findFirst({
        where: eq(userAnalysis.userId, user!.id),
      });

      if (!analysis?.generatedCategories) {
        return c.json({ categories: [] });
      }

      const topCategories = (
        analysis.generatedCategories! as Array<{
          category: string;
          count: number;
        }>
      )
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return c.json({ categories: topCategories });
    },
  );

export default userAnalysisRoutes;
