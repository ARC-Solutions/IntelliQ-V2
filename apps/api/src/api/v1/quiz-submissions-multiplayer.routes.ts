import { count, desc, eq, sql, and } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";
import {
  multiplayerQuizSubmissions,
  questions as questionsTable,
  quizzes,
  userResponses,
  rooms,
} from "../../../drizzle/schema";
import { createDb } from "../../db/index";
import { getSupabase } from "./middleware/auth.middleware";
import { quizType } from "./schemas/common.schemas";
import {
  quizLeaderboardResponseSchema,
  quizQuestionsResponseSchema,
  quizSubmissionAnswerSchema,
  quizSubmissionMultiplayerRequestSchema,
  quizSubmissionMultiplayerResponseSchema,
  quizSubmissionMultiplayerSubmitResponseSchema,
} from "./schemas/quiz.schemas";
import {
  MEDIUM_CACHE,
  createCacheMiddleware,
} from "./middleware/cache.middleware";
import { HTTPException } from "hono/http-exception";

const multiplayerQuizSubmissionsRoutes = new Hono<{ Bindings: CloudflareEnv }>()
  .post(
    "/:roomId/quiz",
    describeRoute({
      tags: ["Quiz Submissions Multiplayer"],
      summary: "Submit a quiz",
      description:
        "This route is called once by the host user. It creates one quiz and one set of questions for the entire lobby.",
      validateResponse: true,
      responses: {
        201: {
          description: "Quiz submitted successfully",
          content: {
            "application/json": {
              schema: resolver(quizSubmissionMultiplayerResponseSchema),
            },
          },
        },
      },
    }),
    zValidator("json", quizSubmissionMultiplayerRequestSchema),
    zValidator("param", z.object({ roomId: z.string().uuid() })),
    async (c) => {
      const { quizTitle, quizTopics, language, questions } =
        c.req.valid("json");
      const { roomId } = c.req.valid("param");

      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const db = await createDb(c);

      try {
        const result = await db.transaction(async (tx) => {
          const room = (await tx.query.rooms.findFirst({
            where: (rooms) => eq(rooms.id, roomId),
          }))!;

          const [createdQuiz] = await tx
            .insert(quizzes)
            .values({
              userId: room.hostId,
              title: quizTitle,
              topic: quizTopics,
              language: language,
              questionsCount: questions.length,
              type: quizType.Enum.multiplayer,
              roomId: roomId,
            })
            .returning({
              id: quizzes.id,
              title: quizzes.title,
            });

          const createdQuestions = [];
          for (const question of questions) {
            const [createdQuestion] = await tx
              .insert(questionsTable)
              .values({
                text: question.text,
                options: question.options,
                correctAnswer: question.correctAnswer,
                quizId: createdQuiz.id,
              })
              .returning({
                id: questionsTable.id,
                text: questionsTable.text,
                options: questionsTable.options,
                correctAnswer: questionsTable.correctAnswer,
              });

            createdQuestions.push({
              questionTitle: createdQuiz.title,
              ...createdQuestion,
            });
          }

          return {
            quizId: createdQuiz.id,
            questions: createdQuestions,
          };
        });
        return c.json(result, 201);
      } catch (error) {
        console.error(error);
        return c.json({ error: `Internal server error ${error}` }, 500);
      }
    }
  )
  .post(
    "/:roomCode/submissions",
    describeRoute({
      tags: ["Quiz Submissions Multiplayer"],
      summary: "Submit quiz answers for a multiplayer room",
      description: "Submit quiz answers for a multiplayer room",
      validateResponse: true,
      responses: {
        201: {
          description: "Quiz submission successful",
          content: {
            "application/json": {
              schema: resolver(quizSubmissionMultiplayerSubmitResponseSchema),
            },
          },
        },
      },
    }),
    zValidator("param", z.object({ roomCode: z.string() })),
    zValidator("json", quizSubmissionAnswerSchema),
    async (c) => {
      const { roomCode } = c.req.valid("param");
      const { questionId, userAnswer, timeTaken } = c.req.valid("json");

      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const db = await createDb(c);

      const result = await db.transaction(
        async (tx) => {
          const currentRoom = await tx.query.rooms.findFirst({
            where: eq(rooms.code, roomCode),
            columns: {
              id: true,
            },
          });

          if (!currentRoom) {
            throw new HTTPException(404, {
              message: "Room not found",
            });
          }

          const quiz = await tx.query.quizzes.findFirst({
            where: eq(quizzes.roomId, currentRoom!.id),
            columns: {
              id: true,
              questionsCount: true,
            },
          });

          if (!quiz) {
            throw new HTTPException(404, {
              message: "No quiz found for this room",
            });
          }

          // Verify all questions exist and belong to this quiz
          const questions = await tx.query.questions.findMany({
            where: eq(questionsTable.quizId, quiz.id),
            columns: {
              id: true,
              correctAnswer: true,
            },
          });

          const questionMap = new Map(
            questions.map((q) => [q.id, q.correctAnswer])
          );

          let correctCount = 0;

          const ans = { questionId, userAnswer, timeTaken }; // answers is now a single object
          const correctAnswer = questionMap.get(ans.questionId);

          if (!correctAnswer) {
            throw new HTTPException(400, {
              message: `Invalid question ID: ${ans.questionId}`,
            });
          }

          const isCorrect = ans.userAnswer === correctAnswer;
          if (isCorrect) correctCount++;

          // Calculate points based on time taken
          // ⌊ ( 1 - (( responseTime / questionTimer ) / 2.2 )) * pointsPossible ⌉

          // Get the room to access the timeLimit
          const room = await tx.query.rooms.findFirst({
            where: eq(rooms.id, currentRoom!.id),
            columns: {
              timeLimit: true,
            },
          });

          if (!room) {
            throw new HTTPException(404, {
              message: "Room not found",
            });
          }

          // Define constants
          const QUESTION_TIMER_MS = room.timeLimit * 1000; // Convert seconds to milliseconds
          const MAX_POINTS = 1000;
          const DIVISOR = 2.2;

          // Calculate points only if the answer is correct
          let timeBasedPoints = 0;
          if (isCorrect && ans.timeTaken !== undefined) {
            // Convert timeTaken from milliseconds and ensure it doesn't exceed the timer
            const responseTimeRatio = Math.min(
              ans.timeTaken / QUESTION_TIMER_MS,
              1
            );

            // Apply modified formula
            timeBasedPoints = Math.round(
              (1 - responseTimeRatio / DIVISOR) * MAX_POINTS
            );

            // Add a small bonus for very fast answers (under 10% of the time limit)
            if (ans.timeTaken < QUESTION_TIMER_MS * 0.1) {
              timeBasedPoints += 50;
            }

            // Ensure minimum points for correct answers
            timeBasedPoints = Math.max(timeBasedPoints, 100);
          }

          const allSubmissions = await tx
            .select()
            .from(multiplayerQuizSubmissions)
            .where(
              and(
                eq(multiplayerQuizSubmissions.roomId, currentRoom!.id),
                eq(multiplayerQuizSubmissions.quizId, quiz.id)
              )
            );

          // Now manually find the user's submission in JavaScript
          const existingSubmission = allSubmissions.find(
            (sub) => sub.userId === user!.id
          );

          let finalSubmission;

          if (existingSubmission) {
            // Calculate the new values explicitly
            const currentCount = existingSubmission.correctAnswersCount || 0;
            const currentScore = existingSubmission.userScore || 0;

            // Only increment if the answer is correct
            const newCorrectCount = isCorrect ? currentCount + 1 : currentCount;
            const newScore = currentScore + (isCorrect ? timeBasedPoints : 0);

            // Update with explicit ID values
            const [updatedSubmission] = await tx
              .update(multiplayerQuizSubmissions)
              .set({
                userScore: newScore,
                correctAnswersCount: newCorrectCount,
              })
              .where(eq(multiplayerQuizSubmissions.id, existingSubmission.id))
              .returning();

            finalSubmission = updatedSubmission;
          } else {
            // For new submissions
            const [newSubmission] = await tx
              .insert(multiplayerQuizSubmissions)
              .values({
                userId: user!.id,
                quizId: quiz.id,
                roomId: currentRoom!.id,
                userScore: isCorrect ? timeBasedPoints : 0,
                correctAnswersCount: isCorrect ? 1 : 0,
              })
              .returning();

            finalSubmission = newSubmission;
          }

          return {
            success: true,
            submission: finalSubmission,
            calculatedScore: isCorrect ? timeBasedPoints : 0,
            totalQuestions: quiz.questionsCount,
            correctAnswer: correctAnswer,
          };
        },
        {
          isolationLevel: "read committed",
        }
      );

      return c.json(result, 201);
    }
  )
  .get(
    "/:roomId/leaderboard",
    createCacheMiddleware("quiz-leaderboard", MEDIUM_CACHE),
    describeRoute({
      tags: ["Quiz Submissions Multiplayer"],
      summary: "Get the leaderboard for a multiplayer room",
      description: "Get the leaderboard for a multiplayer room",
      validateResponse: true,
      responses: {
        200: {
          description: "Leaderboard retrieved successfully",
          content: {
            "application/json": {
              schema: resolver(quizLeaderboardResponseSchema),
            },
          },
        },
      },
    }),
    zValidator("param", z.object({ roomId: z.string().uuid() })),
    async (c) => {
      const { roomId } = c.req.valid("param");

      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const db = await createDb(c);

      // fetch all submissions for this room
      const submissions = await db.query.multiplayerQuizSubmissions.findMany({
        where: eq(multiplayerQuizSubmissions.roomId, roomId),
        with: {
          user: {
            columns: {
              name: true,
            },
          },
        },
        orderBy: desc(multiplayerQuizSubmissions.userScore),
      });

      // shape it for the client
      const result = submissions.map((sub) => ({
        userName: sub.user.name,
        score: sub.userScore,
        correctAnswers: sub.correctAnswersCount,
      }));

      return c.json({ leaderboard: result });
    }
  )
  .get(
    "/:roomId/questions",
    createCacheMiddleware("quiz-questions", MEDIUM_CACHE),
    describeRoute({
      tags: ["Quiz Submissions Multiplayer"],
      summary: "Get the questions for a multiplayer room",
      description: "Get the questions for a multiplayer room",
      validateResponse: true,
      responses: {
        200: {
          description: "Questions retrieved successfully",
          content: {
            "application/json": {
              schema: resolver(quizQuestionsResponseSchema),
            },
          },
        },
      },
    }),
    zValidator("param", z.object({ roomId: z.string().uuid() })),
    async (c) => {
      const { roomId } = c.req.valid("param");

      const db = await createDb(c);

      try {
        const result = await db.transaction(async (tx) => {
          // get the quiz for this room
          const quiz = await tx.query.quizzes.findFirst({
            where: eq(quizzes.roomId, roomId),
            columns: {
              id: true,
              title: true,
            },
          });

          if (!quiz) {
            throw new HTTPException(404, {
              message: "No quiz found for this room",
            });
          }

          // get all questions for this quiz
          const questions = await tx.query.questions.findMany({
            where: eq(questionsTable.quizId, quiz.id),
            columns: {
              id: true,
              text: true,
              options: true,
            },
          });

          return {
            quizId: quiz.id,
            quizTitle: quiz.title,
            questions: questions.map((q) => ({
              id: q.id,
              questionTitle: quiz.title,
              text: q.text,
              options: q.options,
            })),
          };
        });

        return c.json(result);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "No quiz found for this room"
        ) {
          return c.json({ error: error.message }, 404);
        }
        console.error(error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );
export default multiplayerQuizSubmissionsRoutes;
