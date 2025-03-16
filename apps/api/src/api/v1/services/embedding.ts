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
    const [quiz] = await db
      .select({
        id: quizzes.id,
        title: quizzes.title,
        description: quizzes.description,
        topic: quizzes.topic,
        tags: quizzes.tags,
      })
      .from(quizzes)
      .where(eq(quizzes.id, quizId));

    if (!quiz) {
      throw new HTTPException(404, {
        message: "Quiz not found",
      });
    }

    const textToEmbed = [
      quiz.title,
      quiz.description || "",
      quiz.topic.join(" "),
      (quiz.tags || []).join(" "),
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
