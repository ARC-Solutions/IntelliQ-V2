import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { HTTPException } from "hono/http-exception";
import prettyMilliseconds from "pretty-ms";
import { z } from "zod";
import {
  questions as questionsTable,
  quizzes,
  userResponses,
  documents,
  multiplayerQuizSubmissions,
} from "../../../drizzle/schema";
import { createDb } from "../../db/index";
import { incrementUserCacheVersion } from "../../utils/kv-user-version";
import { getSupabase } from "./middleware/auth.middleware";
import {
  MEDIUM_CACHE,
  createCacheMiddleware,
} from "./middleware/cache.middleware";
import { quizType } from "./schemas/common.schemas";
import {
  filterQuerySchema,
  filteredQuizResponseSchema,
  singlePlayerQuizSubmissionRequestSchema,
  singlePlayerQuizSubmissionResponseSchema,
  documentQuizSubmissionRequestSchema,
} from "./schemas/quiz.schemas";
import { queueEmbeddings } from "./services/queue-embeddings";
import { queueTagAnalysis } from "./services/queue-tag-analysis";

const singleplayerQuizSubmissionsRoutes = new Hono<{
  Bindings: CloudflareEnv;
}>()
  .get(
    "/:quizId/questions",
    createCacheMiddleware("quiz-questions", MEDIUM_CACHE),
    describeRoute({
      tags: ["Quiz Submissions Singleplayer"],
      summary: "Get the questions for a single player quiz",
      description: "Get the questions for a single player quiz",
      validateResponse: true,
      responses: {
        200: {
          description: "Questions retrieved successfully",
          content: {
            "application/json": {
              schema: resolver(filteredQuizResponseSchema),
            },
          },
        },
      },
    }),
    zValidator("param", z.object({ quizId: z.string().uuid() })),
    zValidator("query", filterQuerySchema),
    async (c) => {
      const { quizId } = c.req.valid("param");
      const { filter } = c.req.valid("query");

      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const db = await createDb(c);

      const quiz = await db.query.quizzes.findFirst({
        where: and(
          eq(quizzes.id, quizId),
          sql`(${eq(quizzes.userId, user!.id)} OR EXISTS (
            SELECT 1 FROM multiplayer_quiz_submissions
            WHERE quiz_id = ${quizId}
            AND user_id = ${user!.id}
          ))`,
        ),
        columns: {
          id: true,
          title: true,
          userScore: true,
          totalTimeTaken: true,
          correctAnswersCount: true,
          questionsCount: true,
          passingScore: true,
          // TODO: This is temporary, just to make it work for LAUNCHWEEK-01
          type: true,
        },
        with: {
          questions: {
            columns: {
              text: true,
              correctAnswer: true,
            },
            with: {
              userResponses: {
                where: eq(userResponses.userId, user!.id),
                columns: {
                  answer: true,
                  isCorrect: true,
                },
              },
            },
          },
          // TODO: This is temporary, just to make it work for LAUNCHWEEK-01
          multiplayerQuizSubmissions: {
            where: eq(multiplayerQuizSubmissions.userId, user!.id),
            columns: {
              userScore: true,
              correctAnswersCount: true,
            },
          },
        },
      });

      if (!quiz) {
        throw new HTTPException(404, {
          message: "Quiz not found",
        });
      }

      const formattedQuestions = quiz.questions
        .filter((q) => {
          if (filter === "correct")
            return q.userResponses[0]?.isCorrect === true;
          if (filter === "incorrect")
            return q.userResponses[0]?.isCorrect === false;
          return true;
        })
        .map((q) => ({
          text: q.text,
          correctAnswer: q.correctAnswer,
          userAnswer: q.userResponses[0]?.answer,
          userScore: quiz.multiplayerQuizSubmissions[0]?.userScore,
          correctAnswersCount:
            quiz.multiplayerQuizSubmissions[0]?.correctAnswersCount,
        }));

      return c.json({
        quizId: quiz.id,
        quizTitle: quiz.title,
        quizScore: quiz.userScore,
        // totalTime: Number(prettyMilliseconds(quiz.totalTimeTaken! * 1000, {
        //   colonNotation: true,
        //   secondsDecimalDigits: 0,
        // })),
        totalTime: quiz.totalTimeTaken!,
        correctAnswersCount: quiz.correctAnswersCount,
        totalQuestions: quiz.questionsCount,
        questions: formattedQuestions,
        passingScore: quiz.passingScore,
        // TODO: This is temporary, just to make it work for LAUNCHWEEK-01
        type: quiz.type,
      });
    },
  )
  .post(
    "/submit",
    describeRoute({
      tags: ["Quiz Submissions Singleplayer"],
      summary: "Submit a single player quiz",
      description: "Submit a single player quiz",
      validateResponse: true,
      responses: {
        201: {
          description: "Quiz submission successful",
          content: {
            "application/json": {
              schema: resolver(singlePlayerQuizSubmissionResponseSchema),
            },
          },
        },
      },
    }),
    zValidator("json", singlePlayerQuizSubmissionRequestSchema),
    async (c) => {
      const {
        quizTitle,
        description,
        topic,
        tags,
        passingScore,
        language,
        userScore,
        questions,
        timeTaken,
      } = c.req.valid("json");

      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const db = await createDb(c);

      const result = await db.transaction(async (tx) => {
        const [createdQuiz] = await tx
          .insert(quizzes)
          .values({
            userId: user!.id,
            title: quizTitle,
            description,
            topic,
            tags,
            passingScore,
            language,
            type: quizType.enum.singleplayer,
            questionsCount: questions.length,
            totalTimeTaken: timeTaken,
            userScore,
            passed: (100 / questions.length) * userScore >= passingScore,
          })
          .returning();

        const correctAnswersCount = questions.reduce(
          (count, question) =>
            count + (question.userAnswer === question.correctAnswer ? 1 : 0),
          0,
        );

        for (const question of questions) {
          const [createdQuestion] = await tx
            .insert(questionsTable)
            .values({
              quizId: createdQuiz.id,
              text: question.text,
              options: question.options,
              correctAnswer: question.correctAnswer,
            })
            .returning();

          await tx.insert(userResponses).values({
            userId: user!.id,
            quizId: createdQuiz.id,
            questionId: createdQuestion.id,
            answer: question.userAnswer,
            isCorrect: question.userAnswer === question.correctAnswer,
          });
        }

        await tx
          .update(quizzes)
          .set({
            correctAnswersCount,
            userScore,
          })
          .where(eq(quizzes.id, createdQuiz.id));

        await queueTagAnalysis(c, createdQuiz.id, quizType.enum.singleplayer);
        await queueEmbeddings(c, createdQuiz.id);

        return {
          quizId: createdQuiz.id,
          quizTitle: quizTitle,
          quizScore: createdQuiz.userScore,
          totalTime: createdQuiz.totalTimeTaken,
          correctAnswersCount,
          totalQuestions: createdQuiz.questionsCount,
          passingScore: createdQuiz.passingScore,
          questions: questions.map((question) => ({
            text: question.text,
            correctAnswer: question.correctAnswer,
            userAnswer: question.userAnswer,
          })),
        };
      });

      await incrementUserCacheVersion(c.env.IntelliQ_CACHE_VERSION, user!.id);

      return c.json(result, 201);
    },
  )
  .post(
    "/document/submit",
    describeRoute({
      tags: ["Quiz Submissions Singleplayer"],
      summary: "Submit a document-based quiz",
      description: "Submit a quiz generated from a document",
      validateResponse: true,
      responses: {
        201: {
          description: "Document quiz submission successful",
          content: {
            "application/json": {
              schema: resolver(singlePlayerQuizSubmissionResponseSchema),
            },
          },
        },
      },
    }),
    zValidator("json", documentQuizSubmissionRequestSchema),
    async (c) => {
      const {
        documentId,
        quizTitle,
        language,
        passingScore,
        userScore,
        questions,
        timeTaken,
      } = c.req.valid("json");

      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const db = await createDb(c);

      const result = await db.transaction(async (tx) => {
        const [createdQuiz] = await tx
          .insert(quizzes)
          .values({
            userId: user!.id,
            title: quizTitle,
            documentId,
            passingScore,
            language,
            type: quizType.enum.document,
            questionsCount: questions.length,
            totalTimeTaken: timeTaken,
            userScore,
            passed: userScore * 10 >= passingScore,
          })
          .returning();

        const correctAnswersCount = questions.reduce(
          (count, question) =>
            count + (question.userAnswer === question.correctAnswer ? 1 : 0),
          0,
        );

        for (const question of questions) {
          const [createdQuestion] = await tx
            .insert(questionsTable)
            .values({
              quizId: createdQuiz.id,
              text: question.text,
              options: question.options,
              correctAnswer: question.correctAnswer,
            })
            .returning();

          await tx.insert(userResponses).values({
            userId: user!.id,
            quizId: createdQuiz.id,
            questionId: createdQuestion.id,
            answer: question.userAnswer,
            isCorrect: question.userAnswer === question.correctAnswer,
          });
        }

        await tx
          .update(quizzes)
          .set({
            correctAnswersCount,
            userScore,
          })
          .where(eq(quizzes.id, createdQuiz.id));

        // Increment the document's quizCount
        await tx
          .update(documents)
          .set({
            quizCount: sql`${documents.quizCount} + 1`,
          })
          .where(eq(documents.id, documentId));

        // Analysis for document quizzes too
        await queueTagAnalysis(c, createdQuiz.id, quizType.enum.document);
        await queueEmbeddings(c, createdQuiz.id);

        return {
          quizId: createdQuiz.id,
          quizTitle: quizTitle,
          quizScore: createdQuiz.userScore,
          totalTime: createdQuiz.totalTimeTaken,
          correctAnswersCount,
          totalQuestions: createdQuiz.questionsCount,
          passingScore: createdQuiz.passingScore,
          questions: questions.map((question) => ({
            text: question.text,
            correctAnswer: question.correctAnswer,
            userAnswer: question.userAnswer,
          })),
        };
      });

      await incrementUserCacheVersion(c.env.IntelliQ_CACHE_VERSION, user!.id);

      return c.json(result, 201);
    },
  );

export default singleplayerQuizSubmissionsRoutes;
