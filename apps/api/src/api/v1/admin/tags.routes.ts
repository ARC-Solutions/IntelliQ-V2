import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { bearerAuth } from "hono/bearer-auth";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { quizzes } from "../../../../drizzle/schema";
import { createDb } from "../../../db";
import { incrementUserCacheVersion } from "../../../utils/kv-user-version";
import { quizType } from "../schemas/common.schemas";
import type { Quiz } from "../schemas/quiz.schemas";
import {
  analyzeQuizPromptMultiplayer,
  analyzeQuizPromptSingleplayer,
} from "../services/prompts";
import { updateUserTagStats } from "../services/update-user-tag-stats";

const adminTagsRoutes = new Hono<{ Bindings: CloudflareEnv }>()
.post(
  "/analyze",
  bearerAuth({ verifyToken: (token, c) => token === c.env.ADMIN_TOKEN }),
  describeRoute({
    tags: ["Admin"],
    summary: "Analyze tags",
    description: "Analyze tags",
    validateResponse: true,
    responses: {
      200: {
        description: "Tags analyzed successfully",
        content: {
          "application/json": {
            schema: resolver(z.object({
                success: z.boolean(),
                quizId: z.string().uuid(),
                tags: z.array(z.string()),
                categories: z.array(z.string()),
              }),
            ),
          },
        },
      },
    },
  }),
  zValidator(
    "json",
    z.object({
      quizId: z.string().uuid(),
      type: quizType,
    }),
  ),
  async (c) => {
    const db = await createDb(c);
    const { quizId, type } = c.req.valid("json");

    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
      with: {
        questions: true,
        room: {
          with: {
            multiplayerQuizSubmissions: {
              with: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new HTTPException(404, {
        message: "Quiz not found",
      });
    }

    const prompt =
      type === quizType.Enum.multiplayer
        ? analyzeQuizPromptMultiplayer(quiz as Quiz)
        : analyzeQuizPromptSingleplayer(quiz as Quiz);

    const openai = createOpenAI({
      apiKey: c.env.OPENAI_API_KEY,
    });
    const aiTags = await generateObject({
      model: openai(c.env.GPT_MODEL, {
        structuredOutputs: true,
      }),
      schemaName: "tags",
      schemaDescription: "Normalized tags for a quiz.",
      schema: z.object({
        tags: z.array(z.string()),
        categories: z.array(z.string()),
      }),
      prompt,
      maxTokens: 256,
    });

    await db
      .update(quizzes)
      .set({
        generatedTags: aiTags.object.tags,
        generatedCategories: aiTags.object.categories,
      })
      .where(eq(quizzes.id, quizId));

    await updateUserTagStats(
      db,
      quiz.userId,
      aiTags.object.tags,
      aiTags.object.categories,
    );

    if (type === quizType.Enum.multiplayer && quiz.room) {
      await updateUserTagStats(
        db,
        quiz.room.hostId,
        aiTags.object.tags,
        aiTags.object.categories,
      );
    }

    await incrementUserCacheVersion(c.env.IntelliQ_CACHE_VERSION, quiz.userId);
    if (type === quizType.Enum.multiplayer && quiz.room) {
      await incrementUserCacheVersion(
        c.env.IntelliQ_CACHE_VERSION,
        quiz.room.hostId,
      );
    }

    return c.json({
      success: true,
      quizId,
      tags: aiTags.object.tags,
      categories: aiTags.object.categories,
    });
  },
);

export default adminTagsRoutes;
