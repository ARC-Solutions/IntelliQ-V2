import { format } from "date-fns";
import { arrayOverlaps, count, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import prettyMilliseconds from "pretty-ms";
import { quizzes } from "../../../drizzle/schema";
import { createDb } from "../../db/index";
import { getSupabase } from "./middleware/auth.middleware";
import {
  MEDIUM_CACHE,
  createCacheMiddleware,
} from "./middleware/cache.middleware";
import { historyQuerySchema, quizHistoryResponseSchema } from "./schemas/history.schemas";
import { describeRoute } from "hono-openapi";

const historyRoutes = new Hono<{ Bindings: CloudflareEnv }>().get(
  "/",
  describeRoute({
    tags: ["History"],
    summary: "Get user's quiz history",
    description: "Get user's quiz history with optional filtering",
    validateResponse: true,
    responses: {
      200: {
        description: "Quiz history retrieved successfully",
        content: {
          "application/json": {
            schema: resolver(quizHistoryResponseSchema),
          },
        },
      },
    },
  }),
  zValidator(
    "query",
    historyQuerySchema.transform((data) => ({
      ...data,
      tags: data.tags
        ? Array.isArray(data.tags)
          ? data.tags
          : [data.tags]
        : undefined,
    }))
  ),
  createCacheMiddleware("quiz-history", MEDIUM_CACHE),
  async (c) => {
    const { tags, type, status, page, limit } = c.req.valid("query");

    const supabase = getSupabase(c);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const db = await createDb(c);

    const userQuizzes = await db.transaction(async (tx) => {
      const whereConditions = [eq(quizzes.userId, user!.id)];

      if (type) {
        whereConditions.push(eq(quizzes.type, type));
      }

      if (status !== undefined) {
        whereConditions.push(eq(quizzes.passed, status));
      }

      if (tags?.length) {
        whereConditions.push(arrayOverlaps(quizzes.tags, tags));
      }

      const [{ count: totalCount }] = await tx
        .select({ count: count() })
        .from(quizzes)
        .where(whereConditions.reduce((acc, condition) => acc && condition));

      const results = await tx
        .select({
          id: quizzes.id,
          title: quizzes.title,
          score: quizzes.userScore,
          totalTime: quizzes.totalTimeTaken,
          date: quizzes.createdAt,
          correct: quizzes.correctAnswersCount,
          incorrect: sql`${quizzes.questionsCount} - ${quizzes.correctAnswersCount}`,
        })
        .from(quizzes)
        .where(whereConditions.reduce((acc, condition) => acc && condition))
        .orderBy(desc(quizzes.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);

      const quizResults = results.map((quiz) => ({
        ...quiz,
        date: format(quiz.date, "dd.MM.yyyy"),
        totalTime: `${prettyMilliseconds(quiz.totalTime! * 1000, {
          colonNotation: true,
          secondsDecimalDigits: 0,
        })} min`,
      }));

      return {
        data: quizResults,
        pagination: {
          page,
          limit,
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page * limit < totalCount,
          hasPreviousPage: page > 1,
        },
      };
    });

    return c.json(userQuizzes);
  }
);

export default historyRoutes;
