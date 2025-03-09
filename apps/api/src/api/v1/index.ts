import { Hono } from "hono";
import quizzes from "./quizzes.routes";
import multiplayerQuizSubmissionsRoutes from "./quiz-submissions-multiplayer.routes";
import singleplayerQuizSubmissionsRoutes from "./quiz-submissions-singleplayer.routes";
import rooms from "./rooms.routes";
import historyRoutes from "./history.routes";
import shareRoutes from "./share.routes";
import admin from "./admin";
import userAnalysisRoutes from "./tags.routes";

const v1 = new Hono<{ Bindings: CloudflareEnv }>()
  .route("/quizzes", quizzes)
  .route("/quiz-submissions/multiplayer", multiplayerQuizSubmissionsRoutes)
  .route("/quiz-submissions/singleplayer", singleplayerQuizSubmissionsRoutes)
  .route("/rooms", rooms)
  .route("/history", historyRoutes)
  .route("/share", shareRoutes)
  .route("/admin", admin)
  .route("/analysis", userAnalysisRoutes);

export default v1;
