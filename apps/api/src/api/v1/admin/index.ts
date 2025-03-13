import { Hono } from "hono";
import adminTagsRoutes from "./tags.routes";

const admin = new Hono<{ Bindings: CloudflareEnv }>()
  .route("/tags", adminTagsRoutes)

export default admin;
