import { and, desc, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator as zValidator } from 'hono-openapi/zod';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import {
  multiplayerQuizSubmissions,
  questions as questionsTable,
  quizzes,
  rooms,
  userResponses,
} from '../../../drizzle/schema';
import { createDb } from '../../db/index';
import { getSupabase } from './middleware/auth.middleware';
import { MEDIUM_CACHE, createCacheMiddleware } from './middleware/cache.middleware';
import { quizType } from './schemas/common.schemas';
import {
  quizLeaderboardResponseSchema,
  quizQuestionsResponseSchema,
  quizSubmissionAnswerSchema,
  quizSubmissionMultiplayerRequestSchema,
  quizSubmissionMultiplayerResponseSchema,
  quizSubmissionMultiplayerSubmitResponseSchema,
} from './schemas/quiz.schemas';
import { queueEmbeddings } from './services/queue-embeddings';
import { queueTagAnalysis } from './services/queue-tag-analysis';

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

          await queueTagAnalysis(c, createdQuiz.id, quizType.Enum.multiplayer);
          await queueEmbeddings(c, createdQuiz.id);
          
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
    '/:roomCode/submissions',
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
    zValidator('param', z.object({ roomCode: z.string() })),
    zValidator('json', quizSubmissionAnswerSchema),
    async (c) => {
      const { roomCode } = c.req.valid('param');
      const { questionId, userAnswer, timeTaken } = c.req.valid('json');

      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const db = await createDb(c);

      const result = await db.transaction(
        async (tx) => {
          const roomWithQuiz = await tx.query.rooms.findFirst({
            where: eq(rooms.code, roomCode),
            columns: {
              id: true,
              timeLimit: true,
            },
            with: {
              quizzes: {
                columns: {
                  id: true,
                  questionsCount: true,
                },
                limit: 1,
              },
            },
          });

          if (!roomWithQuiz) {
            throw new HTTPException(404, { message: 'Room not found' });
          }

          const quiz = roomWithQuiz.quizzes[0];

          if (!quiz) {
            throw new HTTPException(404, {
              message: 'No quiz found for this room',
            });
          }

          // Get the correct answer for this specific question
          const question = await tx.query.questions.findFirst({
            where: and(eq(questionsTable.id, questionId), eq(questionsTable.quizId, quiz.id)),
            columns: {
              correctAnswer: true,
            },
          });

          if (!question) {
            throw new HTTPException(400, {
              message: `Invalid question ID: ${questionId}`,
            });
          }

          // Evaluate answer correctness
          const isCorrect = userAnswer === question.correctAnswer;

          // Calculate points for correct answers
          const QUESTION_TIMER_MS = roomWithQuiz.timeLimit * 1000;
          const MAX_POINTS = 1000;
          const DIVISOR = 2.2;
          const MIN_POINTS_FOR_CORRECT = 100;
          const FAST_ANSWER_BONUS = 50;
          const FAST_ANSWER_THRESHOLD = 0.1;

          let points = 0;
          if (isCorrect && timeTaken !== undefined) {
            const responseTimeRatio = Math.min(timeTaken / QUESTION_TIMER_MS, 1);
            points = Math.round((1 - responseTimeRatio / DIVISOR) * MAX_POINTS);

            // Add bonus for very fast answers
            if (timeTaken < QUESTION_TIMER_MS * FAST_ANSWER_THRESHOLD) {
              points += FAST_ANSWER_BONUS;
            }

            // Ensure minimum points for correct answers
            points = Math.max(points, MIN_POINTS_FOR_CORRECT);
          }

          // First, record the individual user response
          await tx.insert(userResponses).values({
            userId: user!.id,
            quizId: quiz.id,
            questionId,
            roomId: roomWithQuiz.id,
            answer: userAnswer,
            isCorrect,
            timeTaken,
          });

          // Then, update the user's submission record using a more efficient upsert pattern
          // This avoids race conditions with concurrent submissions
          const existingSubmission = await tx.query.multiplayerQuizSubmissions.findFirst({
            where: and(
              eq(multiplayerQuizSubmissions.userId, user!.id),
              eq(multiplayerQuizSubmissions.quizId, quiz.id),
              eq(multiplayerQuizSubmissions.roomId, roomWithQuiz.id),
            ),
          });

          let submission;

          if (existingSubmission) {
            // Using raw SQL for atomic update to prevent race conditions
            const [updatedSubmission] = await tx.execute(sql`
               UPDATE multiplayer_quiz_submissions
               SET 
                 user_score = user_score + ${isCorrect ? points : 0},
                 correct_answers_count = correct_answers_count + ${isCorrect ? 1 : 0}
               WHERE id = ${existingSubmission.id}
               RETURNING *
             `);
            submission = {
              id: updatedSubmission.id,
              userId: updatedSubmission.user_id,
              quizId: updatedSubmission.quiz_id,
              roomId: updatedSubmission.room_id,
              userScore: updatedSubmission.user_score,
              correctAnswersCount: updatedSubmission.correct_answers_count,
              createdAt: updatedSubmission.created_at,
            };
          } else {
            // Insert new submission
            const [newSubmission] = await tx
              .insert(multiplayerQuizSubmissions)
              .values({
                userId: user!.id,
                quizId: quiz.id,
                roomId: roomWithQuiz.id,
                userScore: isCorrect ? points : 0,
                correctAnswersCount: isCorrect ? 1 : 0,
              })
              .returning();

            submission = newSubmission;
          }

          return {
            success: true,
            submission,
            calculatedScore: isCorrect ? points : 0,
            totalQuestions: quiz.questionsCount,
            correctAnswer: question.correctAnswer,
          };
        },
        {
          isolationLevel: 'repeatable read',
          accessMode: 'read write',
          deferrable: false,
        },
      );

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
