import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";
import { format } from "date-fns";
import { and, arrayContains, count, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import prettyMilliseconds from "pretty-ms";
import { multiplayerQuizSubmissions, quizzes } from "../../../drizzle/schema";
import { createDb } from "../../db/index";
import { getSupabase } from "./middleware/auth.middleware";
import { quizType } from "./schemas/common.schemas";
import {
  historyQuerySchema,
  quizHistoryResponseSchema,
} from "./schemas/history.schemas";
import { z } from "zod";
import {
  MEDIUM_CACHE,
  createCacheMiddleware,
} from "./middleware/cache.middleware";

const historyRoutes = new Hono<{ Bindings: CloudflareEnv }>()
  .get(
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
      })),
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
          whereConditions.push(arrayContains(quizzes.generatedTags, tags));
        }

        const [{ count: totalCount }] = await tx
          .select({ count: count() })
          .from(quizzes)
          .where(sql`${and(...whereConditions)}`);

        const results = await tx
          .select({
            id: quizzes.id,
            title: quizzes.title,
            score: quizzes.userScore,
            totalTime: quizzes.totalTimeTaken,
            date: quizzes.createdAt,
            correct: quizzes.correctAnswersCount,
            incorrect:
              sql`${quizzes.questionsCount} - ${quizzes.correctAnswersCount}`.as(
                "incorrect",
              ),
            passed: quizzes.passed,
            type: quizzes.type,
            multiplayerScore: multiplayerQuizSubmissions.userScore,
            multiplayerCorrect: multiplayerQuizSubmissions.correctAnswersCount,
            questionsCount: quizzes.questionsCount,
          })
          .from(quizzes)
          .leftJoin(
            multiplayerQuizSubmissions,
            eq(multiplayerQuizSubmissions.quizId, quizzes.id),
          )
          .where(sql`${and(...whereConditions)}`)
          .orderBy(desc(quizzes.createdAt))
          .limit(limit)
          .offset((page - 1) * limit);

        const quizResults = results.map((quiz) => {
          if (quiz.type === quizType.Enum.multiplayer) {
            return {
              id: quiz.id,
              title: quiz.title,
              score: quiz.multiplayerScore,
              correct: quiz.multiplayerCorrect,
              incorrect: quiz.questionsCount - quiz.multiplayerCorrect!,
              date: format(quiz.date, "dd/MM/yyyy"),
              type: quiz.type,
            };
          }

          return {
            ...quiz,
            score: quiz.score! * 10,
            date: format(quiz.date, "dd/MM/yyyy"),
            totalTime: `${prettyMilliseconds(quiz.totalTime! * 1000, {
              colonNotation: true,
              secondsDecimalDigits: 0,
            })} min`,
          };
        });

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
    },
  )
  .post(
    "/search",
    describeRoute({
      tags: ["History"],
      summary: "Search user's quiz history",
      description: "Search user's quiz history with optional filtering",
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
      "json",
      z.object({
        query: z.string(),
        page: z.number().default(1),
        limit: z.number().default(10),
      }),
    ),
    async (c) => {
      const { query, page, limit } = c.req.valid("json");

      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const db = await createDb(c);

      // Generate embedding for the search query
      const openai = createOpenAI({
        apiKey: c.env.OPENAI_API_KEY,
      });
      const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: query,
      });

      const userQuizzes = await db.transaction(async (tx) => {
        // Get total count of search results
        const [{ count: totalCount }] = await tx.execute(sql`
          SELECT COUNT(*) FROM (
            SELECT id FROM hybrid_search_quizzes(
              ${query},
              ${sql.raw(`'[${embedding.join(",")}]'::vector(1536)`)},
              ${user!.id}::uuid,
              1000, -- Large number to get total count
              1.0,
              1.0,
              60
            )
          ) AS count
        `);

        // Get search results with pagination
        const searchResults = await tx.execute(sql`
          SELECT 
            q.*,
            m.user_score AS "multiplayerScore",
            m.correct_answers_count AS "multiplayerCorrect",
            (q.questions_count - q.correct_answers_count) AS "incorrect"
          FROM hybrid_search_quizzes(
            ${query},
            ${sql.raw(`'[${embedding.join(",")}]'::vector(1536)`)},
            ${user!.id}::uuid,
            ${limit},
            1.0,
            1.0,
            60
          ) AS q
          LEFT JOIN multiplayer_quiz_submissions m ON m.quiz_id = q.id
          LIMIT ${limit}
          OFFSET ${(page - 1) * limit}
        `);

        // Format results exactly like your existing endpoint
        const quizResults = searchResults.map((quiz) => {
          if (quiz.type === quizType.Enum.multiplayer) {
            return {
              id: quiz.id,
              title: quiz.title,
              score: quiz.multiplayerScore,
              correct: quiz.multiplayerCorrect,
              incorrect:
                (quiz.questions_count as number) -
                (quiz.multiplayerCorrect as number),
              date: format(new Date(quiz.created_at as string), "dd/MM/yyyy"),
              type: quiz.type,
            };
          }

          return {
            id: quiz.id,
            title: quiz.title,
            score: (quiz.user_score as number) * 10,
            totalTime: `${prettyMilliseconds(
              ((quiz.total_time_taken || 0) as number) * 1000,
              {
                colonNotation: true,
                secondsDecimalDigits: 0,
              },
            )} min`,
            date: format(new Date(quiz.created_at as string), "dd/MM/yyyy"),
            correct: quiz.correct_answers_count,
            incorrect: quiz.incorrect,
            passed: quiz.passed,
            type: quiz.type,
            multiplayerScore: null,
            multiplayerCorrect: null,
            questionsCount: quiz.questions_count,
          };
        });

        return {
          data: quizResults,
          pagination: {
            page,
            limit,
            totalItems: Number(totalCount),
            totalPages: Math.ceil(Number(totalCount) / limit),
            hasNextPage: page * limit < Number(totalCount),
            hasPreviousPage: page > 1,
          },
        };
      });

      return c.json(userQuizzes);
    },
  );

export default historyRoutes;
