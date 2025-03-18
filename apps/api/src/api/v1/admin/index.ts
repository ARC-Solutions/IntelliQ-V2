import { Hono } from "hono";
import adminEmbeddingsRoutes from "./embeddings.routes";
import adminTagsRoutes from "./tags.routes";
import adminDocumentsRoutes from "./documents.routes";

const admin = new Hono<{ Bindings: CloudflareEnv }>()
  .route("/tags", adminTagsRoutes)
  .route("/embeddings", adminEmbeddingsRoutes)
  .route("/documents", adminDocumentsRoutes);

export default admin;
