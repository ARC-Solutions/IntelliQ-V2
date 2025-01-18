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
  const { email, password } = await c.req.json();
  
  const supabase = getSupabase(c);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return c.json({
    message: "User logged in!",
    email,
    password,
    data,
  });
});
app.get("/api/user", async (c) => {
  const supabase = getSupabase(c);
  const { data, error } = await supabase.auth.getUser();

  if (error) console.log("error", error);

  if (!data?.user) {
    return c.json({
      message: "You are not logged in.",
    });
  }

  return c.json({
    message: "You are logged in!",
    userId: data.user,
  });
});

export default app;
