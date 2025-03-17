import { Client } from "@upstash/qstash";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

export const queueEmbeddings = async (c: Context, quizId: string) => {
  try {
    const client = new Client({
      token: c.env.QSTASH_TOKEN,
    });

    await client.queue({ queueName: "embeddings" }).enqueueJSON({
      url: `${c.env.API_URL}/api/v1/admin/embeddings`,
      body: { quizId },
      headers: {
        Authorization: `Bearer ${c.env.ADMIN_TOKEN}`,
      },
    });
  } catch (error) {
    throw new HTTPException(500, {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
