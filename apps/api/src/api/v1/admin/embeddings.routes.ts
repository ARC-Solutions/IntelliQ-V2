import { Hono } from "hono";
import { generateQuizEmbedding } from "../services/embedding";
import { bearerAuth } from "hono/bearer-auth";
import { describeRoute } from "hono-openapi";
import { z } from "zod";
import { resolver } from "hono-openapi/zod";

const adminEmbeddingsRoutes = new Hono<{ Bindings: CloudflareEnv }>().post(
  "/",
  bearerAuth({ verifyToken: (token, c) => token === c.env.ADMIN_TOKEN }),
  describeRoute({
    tags: ["Admin"],
    summary: "Generate quiz embedding",
    description: "Generate quiz embedding",
    validateResponse: true,
    responses: {
      200: {
        description: "Quiz embedding generated successfully",
        content: {
          "application/json": {
            schema: resolver(z.object({
                success: z.boolean(),
              }),
            ),
          },
        },
      },
    },
  }),
  async (c) => {
    const { quizId } = await c.req.json();
    await generateQuizEmbedding(c, quizId);
    return c.json({
      success: true,
    });
  },
);

export default adminEmbeddingsRoutes;
