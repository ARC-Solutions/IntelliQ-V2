import { HTTPException } from "hono/http-exception";
import type { quizType } from "./../schemas/common.schemas";
import type { Context } from "hono";
import { Client } from "@upstash/qstash";

export const queueTagAnalysis = async (
  c: Context,
  quizId: string,
  type: (typeof quizType.Enum)[keyof typeof quizType.Enum],
) => {
  try {
    const client = new Client({
      token: c.env.QSTASH_TOKEN,
    });

    await client.queue({ queueName: "tag-analysis" }).enqueueJSON({
      url: `${c.env.API_URL}/api/v1/admin/tags/analyze`,
      body: {
        quizId,
        type,
      },
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
