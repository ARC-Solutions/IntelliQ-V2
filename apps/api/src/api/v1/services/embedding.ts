import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { quizzes } from "../../../../drizzle/schema";
import { createDb } from "../../../db/index";

export const generateQuizEmbedding = async (c: Context, quizId: string) => {
  try {
    const db = await createDb(c);

    // Query the quiz with its questions
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
      columns: {
        id: true,
        title: true,
        description: true,
        topic: true,
        tags: true,
      },
      with: {
        questions: {
          columns: {
            text: true,
            correctAnswer: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new HTTPException(404, {
        message: "Quiz not found",
      });
    }

    // Include questions in the text to embed
    const questionTexts = quiz.questions
      .map((q) => `${q.text} ${q.correctAnswer}`)
      .join(" ");

    const textToEmbed = [
      quiz.title,
      quiz.description || "",
      quiz.topic || "",
      (quiz.tags || []).join(" "),
      questionTexts, // Add the questions text
    ].join(" ");

    const openai = createOpenAI({
      apiKey: c.env.OPENAI_API_KEY,
    });
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: textToEmbed,
    });

    await db
      .update(quizzes)
      .set({
        embedding: embedding,
      })
      .where(eq(quizzes.id, quizId));
  } catch (error) {
    console.error(`Error generating embedding for quiz ${quizId}:`, error);
    throw new HTTPException(500, {
      message: "Error generating embedding for quiz",
      cause: error,
    });
  }
};
