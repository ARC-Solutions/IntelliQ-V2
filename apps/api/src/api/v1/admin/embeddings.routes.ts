import { Hono } from "hono";
import { generateQuizEmbedding } from "../services/embedding";
import { bearerAuth } from "hono/bearer-auth";

const adminEmbeddingsRoutes = new Hono<{ Bindings: CloudflareEnv }>().post(
  "/",
  bearerAuth({ verifyToken: (token, c) => token === c.env.ADMIN_TOKEN }),
  async (c) => {
    const { quizId } = await c.req.json();
    await generateQuizEmbedding(c, quizId);
    return c.json({
      success: true,
    });
  },
);

export default adminEmbeddingsRoutes;
