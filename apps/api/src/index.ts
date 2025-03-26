import { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";
import { cors } from "hono/cors";
import { showRoutes } from "hono/dev";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import api from "./api/index";
import {
  getSupabase,
  supabaseMiddleware,
} from "./api/v1/middleware/auth.middleware";

const app = new Hono();
// Middleware
app.use("*", supabaseMiddleware());
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", cors());

// Define routes variable by chaining all routes
const routes = app
  .route("/api", api)
  .get(
    "/openapi",
    openAPISpecs(app, {
      documentation: {
        info: {
          title: "IntelliQ API",
          description: "API for IntelliQ",
          version: "2.0.0",
        },
        servers: [
          {
            url: "http://localhost:8787",
            description: "Local server",
          },
          {
            url: "https://app.intelliq.dev",
            description: "Production server",
          },
        ],
      },
    }),
  )
  .get("/api/user", async (c) => {
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
  })
  .post("/api/signin", async (c) => {
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

export default app;
export type AppType = typeof routes;
