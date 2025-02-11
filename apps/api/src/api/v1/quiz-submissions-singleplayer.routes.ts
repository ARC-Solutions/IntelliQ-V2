import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";
import {
    questions as questionsTable,
    quizzes,
    userResponses
} from "../../../drizzle/schema";
import { createDb } from "../../db/index";
import { getSupabase } from "./middleware/auth.middleware";
import { quizType } from "./schemas/common.schemas";
import {
    filterQuerySchema,
    filteredQuizResponseSchema,
    singlePlayerQuizSubmissionRequestSchema,
    singlePlayerQuizSubmissionResponseSchema
} from "./schemas/quiz.schemas";

const singleplayerQuizSubmissionsRoutes = new Hono<{
  Bindings: CloudflareEnv;
}>()
  .get(
    "/:quizId/questions",
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
        where: eq(quizzes.id, quizId),
        columns: {
          id: true,
          title: true,
          userScore: true,
          totalTimeTaken: true,
          correctAnswersCount: true,
          questionsCount: true,
        },
        with: {
          questions: {
            with: {
              userResponses: {
                where: eq(userResponses.userId, user!.id),
              },
            },
          },
        },
      });

      if (!quiz) {
        return c.json({ error: "Quiz not found" }, 404);
      }

      const formattedQuestions = quiz.questions.map((q) => ({
        text: q.text,
        correctAnswer: q.correctAnswer,
        userAnswer: q.userResponses[0]?.answer!,
      }));

      const filteredQuestions = formattedQuestions.filter((question) => {
        const isCorrect = question.userAnswer === question.correctAnswer;
        switch (filter) {
          case "correct":
            return isCorrect;
          case "incorrect":
            return !isCorrect;
          default:
            return true;
        }
      });

      return c.json({
        quizId: quiz.id,
        quizTitle: quiz.title,
        quizScore: quiz.userScore,
        totalTime: quiz.totalTimeTaken,
        correctAnswersCount: quiz.correctAnswersCount,
        totalQuestions: quiz.questionsCount,
        questions: filteredQuestions,
      });
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
  );

export default singleplayerQuizSubmissionsRoutes;
