import { Hono } from "hono";
import adminEmbeddingsRoutes from "./embeddings.routes";
import adminTagsRoutes from "./tags.routes";

const admin = new Hono<{ Bindings: CloudflareEnv }>()
  .route("/tags", adminTagsRoutes)
  .route("/embeddings", adminEmbeddingsRoutes);

export default admin;
