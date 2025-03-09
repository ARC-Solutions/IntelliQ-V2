import { count, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator as zValidator } from 'hono-openapi/zod';
import { z } from 'zod';
import {
  multiplayerQuizSubmissions,
  questions as questionsTable,
  quizzes,
  userResponses,
  rooms,
} from '../../../drizzle/schema';
import { createDb } from '../../db/index';
import { getSupabase } from './middleware/auth.middleware';
import { quizType } from './schemas/common.schemas';
import {
  quizLeaderboardResponseSchema,
  quizQuestionsResponseSchema,
  quizSubmissionAnswerSchema,
  quizSubmissionMultiplayerRequestSchema,
  quizSubmissionMultiplayerResponseSchema,
  quizSubmissionMultiplayerSubmitResponseSchema,
} from './schemas/quiz.schemas';
import { MEDIUM_CACHE, createCacheMiddleware } from './middleware/cache.middleware';
import { HTTPException } from 'hono/http-exception';

const multiplayerQuizSubmissionsRoutes = new Hono<{ Bindings: CloudflareEnv }>()
  .post(
    '/:roomId/quiz',
    describeRoute({
      tags: ['Quiz Submissions Multiplayer'],
      summary: 'Submit a quiz',
      description:
        'This route is called once by the host user. It creates one quiz and one set of questions for the entire lobby.',
      validateResponse: true,
      responses: {
        201: {
          description: 'Quiz submitted successfully',
          content: {
            'application/json': {
              schema: resolver(quizSubmissionMultiplayerResponseSchema),
            },
          },
        },
      },
    }),
    zValidator('json', quizSubmissionMultiplayerRequestSchema),
    zValidator('param', z.object({ roomId: z.string().uuid() })),
    async (c) => {
      const { quizTitle, quizTopics, language, questions } = c.req.valid('json');
      const { roomId } = c.req.valid('param');

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
    },
  )
  .post(
    '/:roomId/submissions',
    describeRoute({
      tags: ['Quiz Submissions Multiplayer'],
      summary: 'Submit quiz answers for a multiplayer room',
      description: 'Submit quiz answers for a multiplayer room',
      validateResponse: true,
      responses: {
        201: {
          description: 'Quiz submission successful',
          content: {
            'application/json': {
              schema: resolver(quizSubmissionMultiplayerSubmitResponseSchema),
            },
          },
        },
      },
    }),
    zValidator('param', z.object({ roomId: z.string().uuid() })),
    zValidator('json', quizSubmissionAnswerSchema),
    async (c) => {
      const { roomId } = c.req.valid('param');
      const { questionId, userAnswer, timeTaken } = c.req.valid('json');

      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const db = await createDb(c);

      const result = await db.transaction(async (tx) => {
        const quiz = await tx.query.quizzes.findFirst({
          where: eq(quizzes.roomId, roomId),
          columns: {
            id: true,
            questionsCount: true,
          },
        });

        if (!quiz) {
          throw new HTTPException(404, {
            message: 'No quiz found for this room',
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

        const questionMap = new Map(questions.map((q) => [q.id, q.correctAnswer]));

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
          where: eq(rooms.id, roomId),
          columns: {
            timeLimit: true,
          },
        });

        if (!room) {
          throw new HTTPException(404, {
            message: 'Room not found',
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
          const responseTimeRatio = Math.min(ans.timeTaken / QUESTION_TIMER_MS, 1);

          // Apply modified formula
          timeBasedPoints = Math.round((1 - responseTimeRatio / DIVISOR) * MAX_POINTS);

          // Add a small bonus for very fast answers (under 10% of the time limit)
          if (ans.timeTaken < QUESTION_TIMER_MS * 0.1) {
            timeBasedPoints += 50;
          }

          // Ensure minimum points for correct answers
          timeBasedPoints = Math.max(timeBasedPoints, 100);
        }

        // Store the user's response
        await tx.insert(userResponses).values({
          userId: user!.id,
          quizId: quiz.id,
          questionId: ans.questionId,
          roomId: roomId,
          answer: ans.userAnswer,
          isCorrect: isCorrect,
          timeTaken: ans.timeTaken, // Store the time taken
        });

        // Get the count of correct answers for this user in this quiz
        const correctAnswersResult = await tx
          .select({
            count: count(),
          })
          .from(userResponses)
          .where(
            eq(userResponses.userId, user!.id) &&
              eq(userResponses.quizId, quiz.id) &&
              eq(userResponses.isCorrect, true),
          );

        // Extract the count from the result
        const correctAnswersCount = correctAnswersResult[0]?.count || 0;

        // Ensure the count doesn't exceed the total questions
        const finalCorrectCount = Math.min(correctAnswersCount, quiz.questionsCount);

        // Get the latest submission for this user in this quiz/room to get the current score
        const latestSubmission = await tx.query.multiplayerQuizSubmissions.findFirst({
          where: (submissions) =>
            eq(submissions.userId, user!.id) &&
            eq(submissions.quizId, quiz.id) &&
            eq(submissions.roomId, roomId),
          orderBy: (submissions) => desc(submissions.createdAt),
          columns: {
            userScore: true,
          },
        });

        // Calculate the new score by adding to the existing score (if any)
        const currentScore = latestSubmission?.userScore || 0;
        const newScore = currentScore + (isCorrect ? timeBasedPoints : 0);

        // Check if a submission already exists
        const existingSubmission = await tx.query.multiplayerQuizSubmissions.findFirst({
          where: (submissions) =>
            eq(submissions.userId, user!.id) &&
            eq(submissions.quizId, quiz.id) &&
            eq(submissions.roomId, roomId),
          columns: {
            id: true,
          },
        });

        let finalSubmission;

        if (existingSubmission) {
          // Update existing submission
          const [updatedSubmission] = await tx
            .update(multiplayerQuizSubmissions)
            .set({
              userScore: newScore,
              correctAnswersCount: finalCorrectCount,
            })
            .where(eq(multiplayerQuizSubmissions.id, existingSubmission.id))
            .returning({
              id: multiplayerQuizSubmissions.id,
              userId: multiplayerQuizSubmissions.userId,
              quizId: multiplayerQuizSubmissions.quizId,
              roomId: multiplayerQuizSubmissions.roomId,
              userScore: multiplayerQuizSubmissions.userScore,
              correctAnswersCount: multiplayerQuizSubmissions.correctAnswersCount,
              createdAt: multiplayerQuizSubmissions.createdAt,
            });

          finalSubmission = updatedSubmission;
        } else {
          // Insert new submission
          const [newSubmission] = await tx
            .insert(multiplayerQuizSubmissions)
            .values({
              userId: user!.id,
              quizId: quiz.id,
              roomId: roomId,
              userScore: newScore,
              correctAnswersCount: finalCorrectCount,
            })
            .returning({
              id: multiplayerQuizSubmissions.id,
              userId: multiplayerQuizSubmissions.userId,
              quizId: multiplayerQuizSubmissions.quizId,
              roomId: multiplayerQuizSubmissions.roomId,
              userScore: multiplayerQuizSubmissions.userScore,
              correctAnswersCount: multiplayerQuizSubmissions.correctAnswersCount,
              createdAt: multiplayerQuizSubmissions.createdAt,
            });

          finalSubmission = newSubmission;
        }

        return {
          success: true,
          submission: finalSubmission,
          calculatedScore: isCorrect ? timeBasedPoints : 0,
          totalQuestions: quiz.questionsCount,
        };
      });

      return c.json(result, 201);
    },
  )
  .get(
    '/:roomId/leaderboard',
    createCacheMiddleware('quiz-leaderboard', MEDIUM_CACHE),
    describeRoute({
      tags: ['Quiz Submissions Multiplayer'],
      summary: 'Get the leaderboard for a multiplayer room',
      description: 'Get the leaderboard for a multiplayer room',
      validateResponse: true,
      responses: {
        200: {
          description: 'Leaderboard retrieved successfully',
          content: {
            'application/json': {
              schema: resolver(quizLeaderboardResponseSchema),
            },
          },
        },
      },
    }),
    zValidator('param', z.object({ roomId: z.string().uuid() })),
    async (c) => {
      const { roomId } = c.req.valid('param');

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
              id: true,
            },
            with: {
              userResponses: {
                columns: {
                  answer: true,
                  timeTaken: true,
                  questionId: true,
                },
              },
            },
          },
          quiz: {
            columns: {
              questionsCount: true,
            },
            with: {
              questions: {
                columns: {
                  correctAnswer: true,
                  text: true,
                  id: true,
                },
              },
            },
          },
        },
        orderBy: desc(multiplayerQuizSubmissions.userScore),
      });

      // shape it for the client
      const result = submissions.map((sub) => {
        const totalTimeTaken = sub.user.userResponses.reduce(
          (acc, res) => acc + (res.timeTaken ?? 0),
          0,
        );
        const avgTimeTaken = Number(
          (totalTimeTaken / (sub.user.userResponses.length || 1)).toFixed(2),
        );

        return {
          userName: sub.user.name,
          userId: sub.user.id,
          score: sub.userScore,
          correctAnswers: sub.correctAnswersCount,
          avgTimeTaken,
          totalQuestions: sub.quiz.questionsCount,
          questions: sub.quiz.questions.map((question) => ({
            text: question.text,
            correctAnswer: question.correctAnswer,
            userAnswer:
              sub.user.userResponses.find((res) => res.questionId === question.id)?.answer || '',
            timeTaken:
              sub.user.userResponses.find((res) => res.questionId === question.id)?.timeTaken || 0,
          })),
        };
      });

      return c.json({ leaderboard: result });
    },
  )
  .get(
    '/:roomId/questions',
    createCacheMiddleware('quiz-questions', MEDIUM_CACHE),
    describeRoute({
      tags: ['Quiz Submissions Multiplayer'],
      summary: 'Get the questions for a multiplayer room',
      description: 'Get the questions for a multiplayer room',
      validateResponse: true,
      responses: {
        200: {
          description: 'Questions retrieved successfully',
          content: {
            'application/json': {
              schema: resolver(quizQuestionsResponseSchema),
            },
          },
        },
      },
    }),
    zValidator('param', z.object({ roomId: z.string().uuid() })),
    async (c) => {
      const { roomId } = c.req.valid('param');

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
              message: 'No quiz found for this room',
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
        if (error instanceof Error && error.message === 'No quiz found for this room') {
          return c.json({ error: error.message }, 404);
        }
        console.error(error);
        return c.json({ error: 'Internal server error' }, 500);
      }
    },
  );
export default multiplayerQuizSubmissionsRoutes;
