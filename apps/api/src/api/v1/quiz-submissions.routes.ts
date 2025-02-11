import { desc, eq } from "drizzle-orm";
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
  quizSubmissionMultiplayerRequestSchema,
  quizSubmissionMultiplayerResponseSchema,
  quizSubmissionMultiplayerSubmitResponseSchema,
  quizSubmissionRequestSchema,
  singlePlayerQuizSubmissionRequestSchema,
  singlePlayerQuizSubmissionResponseSchema,
} from "./schemas/quiz.schemas";

const quizSubmissions = new Hono<{ Bindings: CloudflareEnv }>()
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
      const validatedData = c.req.valid("json");
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

          const { quizTitle, quizTopics, language, questions } = validatedData;

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
    "/:roomId/submissions",
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
    zValidator("param", z.object({ roomId: z.string().uuid() })),
    zValidator("json", quizSubmissionRequestSchema),
    async (c) => {
      const { roomId } = c.req.valid("param");
      const { score, answers } = c.req.valid("json");

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
          },
        });

        if (!quiz) {
          throw new Error("No quiz found for this room");
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

        // Process each answer
        for (const ans of answers) {
          const correctAnswer = questionMap.get(ans.questionId);

          if (!correctAnswer) {
            throw new Error(`Invalid question ID: ${ans.questionId}`);
          }

          const isCorrect = ans.userAnswer === correctAnswer;
          if (isCorrect) correctCount++;

          await tx.insert(userResponses).values({
            userId: user!.id,
            quizId: quiz.id,
            questionId: ans.questionId,
            roomId: roomId,
            answer: ans.userAnswer,
            isCorrect: isCorrect,
          });
        }

        const [submission] = await tx
          .insert(multiplayerQuizSubmissions)
          .values({
            userId: user!.id,
            quizId: quiz.id,
            roomId: roomId,
            userScore: score,
            correctAnswersCount: correctCount,
          })
          .returning();

        return {
          success: true,
          submission,
          correctAnswers: correctCount,
        };
      });

      return c.json(result, 201);
    }
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
          })
          .returning();

        const correctAnswersCount = questions.reduce(
          (count: number, question: any) =>
            count + (question.userAnswer === question.correctAnswer ? 1 : 0),
          0
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

        return {
          quizId: createdQuiz.id,
          quizTitle: quizTitle,
          quizScore: createdQuiz.userScore,
          totalTime: createdQuiz.totalTimeTaken,
          correctAnswersCount,
          totalQuestions: createdQuiz.questionsCount,
          questions: questions.map((question: any) => ({
            text: question.text,
            correctAnswer: question.correctAnswer,
            userAnswer: question.userAnswer,
          })),
        };
      });

      return c.json(result, 201);
    }
  )
  .get(
    "/:roomId/leaderboard",
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
            throw new Error("No quiz found for this room");
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
export default quizSubmissions;
