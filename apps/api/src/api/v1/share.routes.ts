import { Hono } from "hono";
import { createDb } from "../../db";
import { getSupabase } from "./middleware/auth.middleware";
import { quizzes, sharedQuizzes } from "../../../drizzle/schema";
import { quizType } from "./schemas/common.schemas";
import { eq, and } from "drizzle-orm";
import {
  createCacheMiddleware,
  MEDIUM_CACHE,
} from "./middleware/cache.middleware";
import { incrementUserCacheVersion } from "../../utils/kv-user-version";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { describeRoute } from "hono-openapi";
import {
  shareSingleplayerQuizResponseSchema,
  shareSingleplayerQuizRequestSchema,
  updateShareSingleplayerQuizRequestSchema,
  updateShareSingleplayerQuizResponseSchema,
  updateShareSingleplayerQuizRequestSchemaParam,
  getShareSingleplayerQuizResponseSchema,
} from "./schemas/share.schemas";

const shareRoutes = new Hono<{ Bindings: CloudflareEnv }>()
  .post(
    "/singleplayer",
    describeRoute({
      tags: ["Share"],
      summary: "Share a singleplayer quiz",
      description: "Share a singleplayer quiz",
      validateResponse: true,
      responses: {
        201: {
          description: "Quiz shared successfully",
          content: {
            "application/json": {
              schema: resolver(shareSingleplayerQuizResponseSchema),
            },
          },
        },
      },
    }),
    zValidator("json", shareSingleplayerQuizRequestSchema),
    async (c) => {
      const { quizId, isAnonymous, isPublic } = c.req.valid("json");

      const db = await createDb(c);
      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const quiz = await db.query.quizzes.findFirst({
        where: and(
          eq(quizzes.id, quizId),
          eq(quizzes.type, quizType.Enum.singleplayer),
          eq(quizzes.userId, user!.id)
        ),
      });

      const [sharedQuiz] = await db
        .insert(sharedQuizzes)
        .values({
          quizId,
          isAnonymous,
          isPublic,
          userId: user!.id,
          type: quizType.Enum.singleplayer,
        })
        .returning();

      const shareUrl = new URL(c.req.url);
      shareUrl.pathname = `/api/v1/share/${sharedQuiz.shareId}`;

      await incrementUserCacheVersion(c.env.IntelliQ_CACHE_VERSION, user!.id);
      return c.json(
        {
          shareId: sharedQuiz.shareId,
          shareUrl: shareUrl.toString(),
          isAnonymous: sharedQuiz.isAnonymous,
          isPublic: sharedQuiz.isPublic,
          type: sharedQuiz.type,
          quiz: {
            quizId: quiz!.id,
            title: quiz!.title,
          },
        },
        201
      );
    }
  )
  .patch(
    "/:shareId",
    describeRoute({
      tags: ["Share"],
      summary: "Update a singleplayer quiz share",
      description: "Update a singleplayer quiz share",
      validateResponse: true,
      responses: {
        200: {
          description: "Quiz share updated successfully",
          content: {
            "application/json": {
              schema: resolver(updateShareSingleplayerQuizResponseSchema),
            },
          },
        },
      },
    }),
    zValidator("json", updateShareSingleplayerQuizRequestSchema),
    zValidator("param", updateShareSingleplayerQuizRequestSchemaParam),
    async (c) => {
      const { shareId } = c.req.valid("param");
      const { isPublic, isAnonymous } = c.req.valid("json");

      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const db = await createDb(c);

      const [updatedShare] = await db
        .update(sharedQuizzes)
        .set({ isPublic: isPublic, isAnonymous: isAnonymous })
        .where(
          and(
            eq(sharedQuizzes.shareId, shareId),
            eq(sharedQuizzes.userId, user!.id)
          )
        )
        .returning();

      const quiz = await db.query.quizzes.findFirst({
        where: eq(quizzes.id, updatedShare.quizId),
      });

      const shareUrl = new URL(c.req.url);
      shareUrl.pathname = `/api/v1/share/${updatedShare.shareId}`;

      await incrementUserCacheVersion(c.env.IntelliQ_CACHE_VERSION, user!.id);

      return c.json({
        shareId: updatedShare.shareId,
        shareUrl: shareUrl.toString(),
        isPublic: updatedShare.isPublic,
        isAnonymous: updatedShare.isAnonymous,
        type: updatedShare.type,
        quiz,
      });
    }
  )
  .get(
    "/:shareId",
    describeRoute({
      tags: ["Share"],
      summary: "Get a singleplayer quiz share",
      description: "Get a singleplayer quiz share",
      validateResponse: true,
      responses: {
        200: {
          description: "Quiz share retrieved successfully",
          content: {
            "application/json": {
              schema: resolver(getShareSingleplayerQuizResponseSchema),
            },
          },
        },
      },
    }),
    zValidator("param", updateShareSingleplayerQuizRequestSchemaParam),
    createCacheMiddleware("share-quiz", MEDIUM_CACHE),
    async (c) => {
      const { shareId } = c.req.valid("param");
      const db = await createDb(c);

      const sharedQuiz = await db.query.sharedQuizzes.findFirst({
        where: and(
          eq(sharedQuizzes.shareId, shareId),
          eq(sharedQuizzes.isPublic, true)
        ),
        with: {
          quiz: true,
          user: {
            columns: {
              name: true,
            },
          },
        },
      });

      const shareUrl = new URL(c.req.url);
      shareUrl.pathname = `/api/v1/share/${shareId}`;

      return c.json({
        quiz: {
          ...sharedQuiz!.quiz,
          createdBy: sharedQuiz!.user.name!,
        },
        shareId: sharedQuiz!.shareId,

        shareUrl: shareUrl.toString(),
        isPublic: sharedQuiz!.isPublic,
        isAnonymous: sharedQuiz!.isAnonymous,
        type: sharedQuiz!.type,
      });
    }
  );

export default shareRoutes;
