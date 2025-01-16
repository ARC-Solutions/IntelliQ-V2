import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { cors } from "hono/cors";
import { supabaseMiddleware, getSupabase } from "./api/v1/middleware/auth.middleware";
import { api } from "./api/v1";

const app = new Hono();
// Middleware
app.use("*", supabaseMiddleware());
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", cors());

// Routes
app.route("/api/v1", api);
app.get("/", (c) => c.json({ status: "ok" }));
app.post("/api/signin", async (c) => {
  const supabase = getSupabase(c);
  const { data, error } = await supabase.auth.signUp({
    email: c.req.param("email")!,
    password: c.req.param("password")!,
  });
  return c.json({
    message: "User logged in!",
  });
});

export default app;
