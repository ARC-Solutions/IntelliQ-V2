import { Hono } from "hono";
import quizzes  from "@routes/quizzes";
import rooms  from "@routes/rooms";

const routes = new Hono<{ Bindings: CloudflareEnv }>()
  .get("/", (c) => c.json({ message: "Hello, world!" }))
  .route("/quizzes", quizzes)
  .route("/rooms", rooms);

export default routes;
