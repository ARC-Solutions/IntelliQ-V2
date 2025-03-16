import { Hono } from "hono";
import { generateQuizEmbedding } from "../services/embedding";

const adminEmbeddingsRoutes = new Hono<{ Bindings: CloudflareEnv }>().post(
  "/",
  async (c) => {
    const { quizId } = await c.req.json();
    await generateQuizEmbedding(c, quizId);
    return c.json({
      success: true,
    });
  },
);

export default adminEmbeddingsRoutes;
