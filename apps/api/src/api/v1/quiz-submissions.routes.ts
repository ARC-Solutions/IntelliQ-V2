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
  rooms
} from "../../../drizzle/schema";
import { createDb } from "../../db/index";
import { getSupabase } from "./middleware/auth.middleware";
import { quizType } from "./schemas/common.schemas";
import {
  quizLeaderboardResponseSchema,
  quizSubmissionMultiplayerRequestSchema,
  quizSubmissionMultiplayerResponseSchema,
  quizSubmissionMultiplayerSubmitResponseSchema,
  quizSubmissionRequestSchema
} from "./schemas/quiz.schemas";

const quizSubmissions = new Hono<{ Bindings: CloudflareEnv }>()
  .post(
    "/:roomId/quiz",
    describeRoute({
      tags: ["Quiz Submissions Multiplayer"],
      summary: "Submit a quiz",
      description:
        "This route is called once by the host user. It creates one quiz and one set of questions for the entire lobby.",
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
        // First get the quiz associated with this room
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
  .get(
    "/:roomId/leaderboard",
    describeRoute({
      tags: ["Quiz Submissions Multiplayer"],
      summary: "Get the leaderboard for a multiplayer room",
      description: "Get the leaderboard for a multiplayer room",
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
  );
export default quizSubmissions;
