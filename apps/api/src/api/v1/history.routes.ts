import { Hono } from "hono";
import { getSupabase } from "./middleware/auth.middleware";
import { createDb } from "../../db/index";
import { quizzes } from "../../../drizzle/schema";
import { eq, desc, arrayOverlaps, sql, count } from "drizzle-orm";
import { quizType } from "./schemas/common.schemas";
import { historyQuerySchema } from "./schemas/history.schemas";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { format } from "date-fns";
import prettyMilliseconds from "pretty-ms";

const historyRoutes = new Hono<{ Bindings: CloudflareEnv }>().get(
  "/",
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
  async (c) => {
    const { tags, type, status, page, limit, offset } = c.req.valid("query");

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
        .offset(offset);

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
