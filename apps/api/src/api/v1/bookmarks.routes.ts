import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";
import { format } from "date-fns";
import { and, arrayContains, count, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import prettyMilliseconds from "pretty-ms";
import { z } from "zod";
import {
    bookmarks,
    multiplayerQuizSubmissions,
    quizzes,
} from "../../../drizzle/schema";
import { createDb } from "../../db/index";
import { getSupabase } from "./middleware/auth.middleware";
import { quizType } from "./schemas/common.schemas";
import {
    historyQuerySchema,
    quizHistoryResponseSchema,
} from "./schemas/history.schemas";

const bookmarksRoutes = new Hono<{ Bindings: CloudflareEnv }>()
  .get(
    "/",
    describeRoute({
      tags: ["Bookmarks"],
      summary: "Get user's bookmarked quizzes",
      description: "Get user's bookmarked quizzes with pagination",
      validateResponse: true,
      responses: {
        200: {
          description: "Bookmarked quizzes retrieved successfully",
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
    async (c) => {
      const { tags, type, status, page, limit } = c.req.valid("query");

      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const db = await createDb(c);

      const userBookmarks = await db.transaction(async (tx) => {
        const whereConditions = [eq(bookmarks.userId, user!.id)];

        if (type) {
          whereConditions.push(eq(quizzes.type, type));
        }

        if (status !== undefined) {
          whereConditions.push(eq(quizzes.passed, status));
        }

        if (tags?.length) {
          whereConditions.push(arrayContains(quizzes.generatedTags, tags));
        }

        // Get total count with filters
        const [{ count: totalCount }] = await tx
          .select({ count: count() })
          .from(bookmarks)
          .innerJoin(quizzes, eq(bookmarks.quizId, quizzes.id))
          .where(sql`${and(...whereConditions)}`);

        // Get bookmarked quizzes with filters
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
            roomId: multiplayerQuizSubmissions.roomId,
            isBookmarked: sql<boolean>`EXISTS (
      SELECT 1 FROM ${bookmarks}
      WHERE ${bookmarks.quizId} = ${quizzes.id}
      AND ${bookmarks.userId} = ${user!.id}
    )`.as("isBookmarked"),
          })
          .from(bookmarks)
          .innerJoin(quizzes, eq(bookmarks.quizId, quizzes.id))
          .leftJoin(
            multiplayerQuizSubmissions,
            and(
              eq(multiplayerQuizSubmissions.quizId, quizzes.id),
              eq(multiplayerQuizSubmissions.userId, user!.id),
            ),
          )
          .where(sql`${and(...whereConditions)}`)
          .orderBy(desc(bookmarks.createdAt))
          .limit(limit)
          .offset((page - 1) * limit);

        const bookmarkResults = results.map((quiz) => {
          if (quiz.type === quizType.Enum.multiplayer) {
            return {
              id: quiz.id,
              title: quiz.title,
              score: quiz.multiplayerScore,
              correct: quiz.multiplayerCorrect,
              incorrect: quiz.questionsCount - quiz.multiplayerCorrect!,
              date: format(quiz.date, "dd/MM/yyyy"),
              type: quiz.type,
              isBookmarked: quiz.isBookmarked,
              roomId: quiz.roomId,
            };
          }

          if (quiz.type === quizType.Enum.document) {
            return {
              id: quiz.id,
              title: quiz.title,
              score: quiz.score! * 10,
              totalTime: `${prettyMilliseconds(quiz.totalTime! * 1000, {
                colonNotation: true,
                secondsDecimalDigits: 0,
              })} min`,
              date: format(quiz.date, "dd/MM/yyyy"),
              correct: quiz.correct,
              incorrect: quiz.incorrect,
              passed: quiz.passed,
              type: quiz.type,
              isBookmarked: quiz.isBookmarked,
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
            isBookmarked: quiz.isBookmarked,
          };
        });

        return {
          data: bookmarkResults,
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

      return c.json(userBookmarks);
    },
  )
  .post(
    "/search",
    describeRoute({
      tags: ["Bookmarks"],
      summary: "Search user's bookmarked quizzes",
      description: "Search user's bookmarked quizzes with optional filtering",
      validateResponse: true,
      responses: {
        200: {
          description: "Bookmarked quizzes retrieved successfully",
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

      const userBookmarks = await db.transaction(async (tx) => {
        // Get total count of search results
        const [{ count: totalCount }] = await tx.execute(sql`
            SELECT COUNT(*) FROM (
              SELECT DISTINCT q.id FROM hybrid_search_quizzes(
                ${query},
                ${sql.raw(`'[${embedding.join(",")}]'::vector(1536)`)},
                ${user!.id}::uuid,
                1000, -- Large number to get total count
                1.0,
                1.0,
                60
              ) AS q
              INNER JOIN ${bookmarks} b ON b.quiz_id = q.id
              WHERE b.user_id = ${user!.id}::uuid
            ) AS count
          `);

        // Get search results with pagination
        const searchResults = await tx.execute(sql`
            SELECT
              q.*,
              m.user_score AS "multiplayerScore",
              m.correct_answers_count AS "multiplayerCorrect",
              (q.questions_count - q.correct_answers_count) AS "incorrect",
              EXISTS (
      SELECT 1 FROM ${bookmarks}
      WHERE quiz_id = q.id
      AND user_id = ${user!.id}::uuid
    ) AS "isBookmarked"
            FROM hybrid_search_quizzes(
              ${query},
              ${sql.raw(`'[${embedding.join(",")}]'::vector(1536)`)},
              ${user!.id}::uuid,
              ${limit},
              1.0,
              1.0,
              60
            ) AS q
            INNER JOIN ${bookmarks} b ON b.quiz_id = q.id
            LEFT JOIN ${multiplayerQuizSubmissions} m ON m.quiz_id = q.id
            WHERE b.user_id = ${user!.id}::uuid
            LIMIT ${limit}
            OFFSET ${(page - 1) * limit}
          `);

        // Format results exactly like the GET endpoint
        const bookmarkResults = searchResults.map((quiz) => {
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
              isBookmarked: quiz.isBookmarked,
            };
          }

          if (quiz.type === quizType.Enum.document) {
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
              isBookmarked: quiz.isBookmarked,
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
            isBookmarked: quiz.isBookmarked,
          };
        });

        return {
          data: bookmarkResults,
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

      return c.json(userBookmarks);
    },
  )
  .post(
    "/:id",
    describeRoute({
      tags: ["Bookmarks"],
      summary: "Add a quiz to user's bookmarks",
      description: "Add a quiz to user's bookmarks",
      validateResponse: true,
      responses: {
        200: {
          description: "Quiz added to bookmarks successfully",
        },
        400: {
          description: "Quiz already bookmarked or invalid quiz ID",
        },
        403: {
          description: "Not authorized to bookmark this quiz",
        },
      },
    }),
    zValidator(
      "param",
      z.object({
        id: z.string().uuid(),
      }),
    ),
    async (c) => {
      const { id } = c.req.valid("param");

      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const db = await createDb(c);

      try {
        await db.transaction(async (tx) => {
          // Check if quiz exists
          const [quiz] = await tx
            .select({
              id: quizzes.id,
              userId: quizzes.userId,
            })
            .from(quizzes)
            .where(eq(quizzes.id, id));

          if (!quiz) {
            throw new Error("Quiz not found");
          }

          // Check if quiz belongs to user
          if (quiz.userId !== user!.id) {
            throw new Error("Not authorized to bookmark this quiz");
          }

          // Check if already bookmarked
          const [existingBookmark] = await tx
            .select()
            .from(bookmarks)
            .where(
              and(eq(bookmarks.userId, user!.id), eq(bookmarks.quizId, id)),
            );

          if (existingBookmark) {
            throw new Error("Quiz already bookmarked");
          }

          // Add bookmark
          await tx.insert(bookmarks).values({
            userId: user!.id,
            quizId: id,
          });
        });

        return c.json({
          success: true,
          message: "Quiz added to bookmarks successfully",
        });
      } catch (error) {
        if (error instanceof Error) {
          switch (error.message) {
            case "Quiz not found":
            case "Quiz already bookmarked":
              return c.json(
                {
                  success: false,
                  message: error.message,
                },
                400,
              );
            case "Not authorized to bookmark this quiz":
              return c.json(
                {
                  success: false,
                  message: error.message,
                },
                403,
              );
            default:
              return c.json(
                {
                  success: false,
                  message: "Internal server error",
                  error: error.message,
                },
                500,
              );
          }
        }
        return c.json(
          {
            success: false,
            message: "Internal server error",
          },
          500,
        );
      }
    },
  )
  .delete(
    "/:id",
    describeRoute({
      tags: ["Bookmarks"],
      summary: "Delete a quiz from user's bookmarks",
      description: "Delete a quiz from user's bookmarks",
      validateResponse: true,
      responses: {
        200: {
          description: "Quiz removed from bookmarks successfully",
        },
        400: {
          description: "Invalid bookmark ID",
        },
        403: {
          description: "Not authorized to delete this bookmark",
        },
      },
    }),
    zValidator("param", z.object({ id: z.string().uuid() })),
    async (c) => {
      const { id } = c.req.valid("param");

      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const db = await createDb(c);

      try {
        await db.transaction(async (tx) => {
          // Check if bookmark exists
          const [bookmark] = await tx
            .select()
            .from(bookmarks)
            .where(
              and(eq(bookmarks.userId, user!.id), eq(bookmarks.quizId, id)),
            );

          if (!bookmark) {
            throw new Error("Bookmark not found");
          }

          // Delete bookmark
          await tx
            .delete(bookmarks)
            .where(
              and(eq(bookmarks.userId, user!.id), eq(bookmarks.quizId, id)),
            );
        });

        return c.json({
          success: true,
          message: "Quiz removed from bookmarks successfully",
        });
      } catch (error) {
        if (error instanceof Error) {
          switch (error.message) {
            case "Bookmark not found":
              return c.json(
                {
                  success: false,
                  message: error.message,
                },
                400,
              );
            case "Not authorized to delete this bookmark":
              return c.json(
                {
                  success: false,
                  message: error.message,
                },
                403,
              );
            default:
              return c.json(
                {
                  success: false,
                  message: "Internal server error",
                  error: error.message,
                },
                500,
              );
          }
        }
        return c.json(
          {
            success: false,
            message: "Internal server error",
          },
          500,
        );
      }
    },
  );

export default bookmarksRoutes;
