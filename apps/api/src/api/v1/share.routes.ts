import { Hono } from "hono";
import { createDb } from "../../db";
import { getSupabase } from "./middleware/auth.middleware";
import { quizzes, sharedQuizzes } from "@drizzle/schema";
import { quizType } from "./schemas/common.schemas";
import { eq, and } from "drizzle-orm";

const shareRoutes = new Hono<{ Bindings: CloudflareEnv }>()
  .post("/singleplayer", async (c) => {
    const { quizId, isAnonymous, isPublic } = await c.req.json();

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

    return c.json(
      {
        shareId: sharedQuiz.shareId,
        shareUrl: shareUrl.toString(),
        isAnonymous: sharedQuiz.isAnonymous,
        isPublic: sharedQuiz.isPublic,
        type: sharedQuiz.type,
        quiz,
      },
      201
    );
  })
  .patch("/:shareId", async (c) => {
    const { shareId } = c.req.param();
    const { isPublic, isAnonymous } = await c.req.json();

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

    return c.json({
      shareId: updatedShare.shareId,
      shareUrl: shareUrl.toString(),
      isPublic: updatedShare.isPublic,
      isAnonymous: updatedShare.isAnonymous,
      type: updatedShare.type,
      quiz,
    });
  })
  .get("/:shareId", async (c) => {
    const { shareId } = c.req.param();
    const db = await createDb(c);

    const sharedQuiz = await db.query.sharedQuizzes.findFirst({
      where: and(
        eq(sharedQuizzes.shareId, shareId),
        eq(sharedQuizzes.isPublic, true)
      ),
      with: {
        quiz: true,
      },
    });

    const shareUrl = new URL(c.req.url);
    shareUrl.pathname = `/api/v1/share/${shareId}`;

    return c.json({
      shareId: sharedQuiz!.shareId,
      shareUrl: shareUrl.toString(),
      isPublic: sharedQuiz!.isPublic,
      isAnonymous: sharedQuiz!.isAnonymous,
      type: sharedQuiz!.type,
      quiz: sharedQuiz!.quiz,
    });
  });

export default shareRoutes;
