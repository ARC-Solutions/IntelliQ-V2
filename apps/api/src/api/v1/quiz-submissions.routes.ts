import { createDb } from "@/db";
import { questions, quizzes, rooms, userResponses } from "@drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";
import { getSupabase } from "./middleware/auth.middleware";
import { quizType } from "./schemas/common.schemas";
import { quizSubmissionMultiplayerRequestSchema } from "./schemas/quiz.schemas";

const quizSubmissions = new Hono<{ Bindings: CloudflareEnv }>().post(
  "/:roomId",
  zValidator("param", z.object({ roomId: z.string().uuid() })),
  zValidator("json", quizSubmissionMultiplayerRequestSchema),
  async (c) => {
    const validatedData = c.req.valid("json");
    const { roomId } = c.req.valid("param");

    const supabase = getSupabase(c);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const db = await createDb(c);
    let createdQuizId: string = "";

    try {
      const quiz = await db.transaction(async (tx) => {
        const [createdQuiz] = await tx
          .insert(quizzes)
          .values({
            userId: user!.id,
            title: validatedData.quizTitle,
            topic: validatedData.topics,
            language: validatedData.language,
            userScore: validatedData.userScore,
            type: quizType.Enum.multiplayer,
            correctAnswersCount: validatedData.questions.reduce(
              (count, q) => count + (q.userAnswer === q.correctAnswer ? 1 : 0),
              0
            ),
            questionsCount: validatedData.questions.length,
            roomId: roomId,
          })
          .returning({ id: quizzes.id });

        createdQuizId = createdQuiz.id;

        for (const question of validatedData.questions) {
          const [createdQuestion] = await tx
            .insert(questions)
            .values({
              quizId: createdQuizId,
              text: question.text,
              options: question.options,
              correctAnswer: question.correctAnswer,
            })
            .returning({ id: questions.id });

          await tx.insert(userResponses).values({
            userId: user!.id,
            quizId: createdQuizId,
            questionId: createdQuestion.id,
            roomId: roomId,
            answer: question.userAnswer,
            isCorrect: question.userAnswer === question.correctAnswer,
          });
        }
        await tx
          .update(rooms)
          .set({ quizId: createdQuizId })
          .where(eq(rooms.id, roomId));

        // Get all quizzes for this room
        const submissions = await tx.query.quizzes.findMany({
          where: eq(quizzes.roomId, roomId),
          orderBy: desc(quizzes.userScore),
          with: {
            user: {
              columns: {
                name: true,
              },
            },
          },
        });

        return {
          quizId: createdQuizId,
          submissions: submissions.map((submission) => ({
            name: submission.user.name,
            score: submission.userScore,
          })),
        };
      });

      return c.json(quiz, 201);
    } catch (error) {
      console.error("Error creating quiz:", error);
      return c.json({ error: `Failed to create quiz: ${error}` }, 500);
    }
  }
);

export default quizSubmissions;
