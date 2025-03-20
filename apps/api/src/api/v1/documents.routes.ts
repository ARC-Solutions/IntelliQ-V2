import { SupabaseHybridSearch } from "@langchain/community/retrievers/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Client } from "@upstash/qstash";
import { format } from "date-fns";
import { count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { documents } from "../../../drizzle/schema";
import { createDb } from "../../db/index";
import { incrementUserCacheVersion } from "../../utils/kv-user-version";
import { getSupabase } from "./middleware/auth.middleware";
import {
  MEDIUM_CACHE,
  createCacheMiddleware,
} from "./middleware/cache.middleware";

const ALLOWED_TYPES = new Map([
  ["pdf", "application/pdf"],
  //   ["doc", "application/msword"],
  //   [
  //     "docx",
  //     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  //   ],
  //   ["txt", "text/plain"],
]);

interface DocumentMetadata {
  originalName: string;
  extension: string;
  sizeInKb: number;
  size: number;
  mimeType: string;
  contentType: string;
  storagePath: string;
  lastModified: string;
  uploadedBy: string;
  uploadTimestamp: string;
  signedUrlExpiry: string;
  processingStatus: string;
}

interface SearchDocumentResult extends Record<string, unknown> {
  id: number;
  metadata: DocumentMetadata;
  created_at: string;
  quiz_count: number;
  processing_status: string;
  similarity: number;
}

const documentsRoutes = new Hono<{ Bindings: CloudflareEnv }>()
  .post(
    "/upload",
    describeRoute({
      tags: ["Documents"],
      summary: "Upload a document",
      description: "Upload a document to the database",
      validateResponse: true,
      responses: {
        201: {
          description: "Document uploaded successfully",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  success: z.boolean(),
                  message: z.string(),
                  data: z.object({
                    id: z.number(),
                    fileName: z.string(),
                    fileType: z.string(),
                    uploadDate: z.string(),
                    size: z.string(),
                    status: z.string(),
                    metadata: z.object({
                      size: z.number(),
                      mimeType: z.string(),
                      sizeInKb: z.number(),
                      extension: z.string(),
                      uploadedBy: z.string(),
                      contentType: z.string(),
                      storagePath: z.string(),
                      lastModified: z.string(),
                      originalName: z.string(),
                      signedUrlExpiry: z.string(),
                      uploadTimestamp: z.string(),
                      processingStatus: z.string(),
                    }),
                  }),
                }),
              ),
            },
          },
        },
      },
    }),
    async (c) => {
      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new HTTPException(401, { message: "Unauthorized" });
      }

      const formData = await c.req.parseBody();
      const file = formData["file"] as File;

      if (!file) {
        throw new HTTPException(400, { message: "No file provided" });
      }

      // Validate file type
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (!fileExtension || !ALLOWED_TYPES.has(fileExtension)) {
        throw new HTTPException(400, {
          message: "Unsupported file type. Allowed types: PDF, DOC, DOCX, TXT",
        });
      }

      const buffer = await file.arrayBuffer();
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from("documents")
        .upload(filePath, buffer, {
          contentType: ALLOWED_TYPES.get(fileExtension),
          upsert: false,
        });

      if (error) {
        throw new HTTPException(500, { message: error.message });
      }

      const signedUrlResponse = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 3600);

      const { signedUrl } = signedUrlResponse.data!;

      const db = await createDb(c);
      const [document] = await db
        .insert(documents)
        .values({
          userId: user.id,
          fileUrl: signedUrl,
          content: "", // Will be populated by background processing
          metadata: {
            originalName: file.name,
            contentType: file.type,
            extension: fileExtension,
            uploadTimestamp: new Date().toISOString(),
            size: file.size,
            sizeInKb: Math.round(file.size / 1024),
            lastModified: new Date(file.lastModified).toISOString(),
            storagePath: filePath,
            mimeType: ALLOWED_TYPES.get(fileExtension),
            uploadedBy: user.id,
            processingStatus: "pending",
            signedUrlExpiry: new Date(Date.now() + 3600 * 1000).toISOString(),
          },
          fileName: file.name,
          fileType: fileExtension,
          fileSize: Math.round(file.size / 1024),
          pageCount: 1, // Will be updated during processing
          processingStatus: "pending",
          lastAccessed: new Date().toISOString(),
          quizCount: 0,
          embedding: null, // Will be generated during processing
        })
        .returning();

      const client = new Client({
        token: c.env.QSTASH_TOKEN,
      });

      await client.queue({ queueName: "document-processing" }).enqueueJSON({
        url: `${c.env.API_URL}/api/v1/admin/documents/process`,
        body: {
          documentId: document.id,
          fileType: document.fileType,
        },
        headers: {
          Authorization: `Bearer ${c.env.ADMIN_TOKEN}`,
        },
      });

      await incrementUserCacheVersion(c.env.IntelliQ_CACHE_VERSION, user.id);

      return c.json(
        {
          success: true,
          message: "Document uploaded successfully",
          data: {
            id: document.id,
            fileName: document.fileName,
            fileType: document.fileType.toUpperCase(),
            uploadDate: document.createdAt,
            size: `${document.fileSize} KB`,
            status: document.processingStatus,
            metadata: document.metadata,
          },
        },
        201,
      );
    },
  )
  .delete(
    "/:id",
    describeRoute({
      tags: ["Documents"],
      summary: "Delete a document",
      description: "Delete a document from the database and storage",
      validateResponse: true,
      responses: {
        200: {
          description: "Document deleted successfully",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  success: z.boolean(),
                  message: z.string(),
                }),
              ),
            },
          },
        },
      },
    }),
    zValidator("param", z.object({ id: z.coerce.number() })),
    async (c) => {
      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { id } = c.req.valid("param");

      const db = await createDb(c);
      const document = await db
        .delete(documents)
        .where(eq(documents.id, id))
        .returning();

      if (!document) {
        throw new HTTPException(404, { message: "Document not found" });
      }

      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([(document[0].metadata as DocumentMetadata).storagePath]);

      if (storageError) {
        throw new HTTPException(500, { message: storageError.message });
      }

      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);

      if (dbError) {
        throw new HTTPException(500, { message: dbError.message });
      }

      await incrementUserCacheVersion(c.env.IntelliQ_CACHE_VERSION, user!.id);

      return c.json({
        success: true,
        message: "Document deleted successfully",
      });
    },
  )
  .get(
    "/",
    describeRoute({
      tags: ["Documents"],
      summary: "Get all documents",
      description: "Get all documents from the database",
      validateResponse: true,
      responses: {
        200: {
          description: "Documents fetched successfully",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  data: z.array(
                    z.object({
                      id: z.number(),
                      title: z.string(),
                      type: z.string(),
                      uploadDate: z.string(),
                      size: z.string(),
                      quizCount: z.number(),
                      processingStatus: z.enum([
                        "pending",
                        "extracting_text",
                        "chunking",
                        "embedding",
                        "completed",
                        "failed",
                      ]),
                    }),
                  ),
                  pagination: z.object({
                    page: z.number(),
                    limit: z.number(),
                    totalItems: z.number(),
                    totalPages: z.number(),
                    hasNextPage: z.boolean(),
                    hasPreviousPage: z.boolean(),
                  }),
                }),
              ),
            },
          },
        },
      },
    }),
    zValidator(
      "query",
      z.object({
        page: z.coerce.number().default(1),
        limit: z.coerce.number().default(10),
      }),
    ),
    // createCacheMiddleware("documents", MEDIUM_CACHE),
    async (c) => {
      const { page, limit } = c.req.valid("query");
      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const db = await createDb(c);

      const countResult = await db
        .select({ count: count() })
        .from(documents)
        .where(eq(documents.userId, user!.id))
        .groupBy(documents.userId);

      const totalCount = countResult.length > 0 ? countResult[0].count : 0;

      const userDocs = await db.query.documents.findMany({
        columns: {
          id: true,
          metadata: true,
          quizCount: true,
          createdAt: true,
          processingStatus: true,
        },
        where: eq(documents.userId, user!.id),
        orderBy: [desc(documents.createdAt)],
        limit,
        offset: (page - 1) * limit,
      });

      const formattedDocs = userDocs.map((doc) => ({
        id: doc.id,
        title: (doc.metadata as DocumentMetadata).originalName
          .split(".")
          .slice(0, -1)
          .join("."),
        type: (doc.metadata as DocumentMetadata).extension.toUpperCase(),
        uploadDate: format(new Date(doc.createdAt as string), "MMM-dd-yyyy"),
        size: `${(doc.metadata as DocumentMetadata).sizeInKb} KB`,
        quizCount: doc.quizCount,
        processingStatus: doc.processingStatus as
          | "pending"
          | "extracting_text"
          | "chunking"
          | "embedding"
          | "completed"
          | "failed",
      }));

      return c.json({
        data: formattedDocs,
        pagination: {
          page,
          limit,
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page * limit < totalCount,
          hasPreviousPage: page > 1,
        },
      });
    },
  )
  .get(
    "/most-quizzed",
    describeRoute({
      tags: ["Documents"],
      summary: "Get most quizzed documents",
      description: "Get the top 5 most quizzed documents from the database",
      validateResponse: true,
      responses: {
        200: {
          description: "Documents fetched successfully",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  data: z.array(
                    z.object({
                      id: z.number(),
                      title: z.string(),
                      type: z.string(),
                      uploadDate: z.string(),
                      size: z.string(),
                      quizCount: z.number(),
                      processingStatus: z.enum([
                        "pending",
                        "extracting_text",
                        "chunking",
                        "embedding",
                        "completed",
                        "failed",
                      ]),
                    }),
                  ),
                }),
              ),
            },
          },
        },
      },
    }),
    zValidator(
      "query",
      z.object({
        limit: z.coerce.number().default(5),
      }),
    ),
    createCacheMiddleware("documents-most-quizzed", MEDIUM_CACHE),
    async (c) => {
      const { limit } = c.req.valid("query");
      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const db = await createDb(c);

      const userDocs = await db.query.documents.findMany({
        columns: {
          id: true,
          metadata: true,
          quizCount: true,
          createdAt: true,
          processingStatus: true,
        },
        where: eq(documents.userId, user!.id),
        orderBy: [desc(documents.quizCount)],
        limit,
      });

      const formattedDocs = userDocs.map((doc) => ({
        id: doc.id,
        title: (doc.metadata as DocumentMetadata).originalName
          .split(".")
          .slice(0, -1)
          .join("."),
        type: (doc.metadata as DocumentMetadata).extension.toUpperCase(),
        uploadDate: format(new Date(doc.createdAt as string), "MMM-dd-yyyy"),
        size: `${(doc.metadata as DocumentMetadata).sizeInKb} KB`,
        quizCount: doc.quizCount,
        processingStatus: doc.processingStatus as
          | "pending"
          | "extracting_text"
          | "chunking"
          | "embedding"
          | "completed"
          | "failed",
      }));

      return c.json({
        data: formattedDocs,
      });
    },
  )
  .get(
    "/recent",
    describeRoute({
      tags: ["Documents"],
      summary: "Get recent documents",
      description: "Get the 5 most recent documents from the database",
      validateResponse: true,
      responses: {
        200: {
          description: "Documents fetched successfully",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  data: z.array(
                    z.object({
                      id: z.number(),
                      title: z.string(),
                      type: z.string(),
                      uploadDate: z.string(),
                      size: z.string(),
                      quizCount: z.number(),
                      processingStatus: z.enum([
                        "pending",
                        "extracting_text",
                        "chunking",
                        "embedding",
                        "completed",
                        "failed",
                      ]),
                    }),
                  ),
                }),
              ),
            },
          },
        },
      },
    }),
    zValidator(
      "query",
      z.object({
        limit: z.coerce.number().default(5),
      }),
    ),
    createCacheMiddleware("documents-recent", MEDIUM_CACHE),
    async (c) => {
      const { limit } = c.req.valid("query");
      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const db = await createDb(c);

      const userDocs = await db.query.documents.findMany({
        columns: {
          id: true,
          metadata: true,
          quizCount: true,
          createdAt: true,
          processingStatus: true,
        },
        where: eq(documents.userId, user!.id),
        orderBy: [desc(documents.createdAt)],
        limit,
      });

      const formattedDocs = userDocs.map((doc) => ({
        id: doc.id,
        title: (doc.metadata as DocumentMetadata).originalName
          .split(".")
          .slice(0, -1)
          .join("."),
        type: (doc.metadata as DocumentMetadata).extension.toUpperCase(),
        uploadDate: format(new Date(doc.createdAt as string), "MMM-dd-yyyy"),
        size: `${(doc.metadata as DocumentMetadata).sizeInKb} KB`,
        quizCount: doc.quizCount,
        processingStatus: doc.processingStatus as
          | "pending"
          | "extracting_text"
          | "chunking"
          | "embedding"
          | "completed"
          | "failed",
      }));

      return c.json({
        data: formattedDocs,
      });
    },
  )
  .post(
    "/search",
    describeRoute({
      tags: ["Documents"],
      summary: "Search documents",
      description:
        "Search documents using hybrid search (full-text + semantic)",
      responses: {
        200: {
          description: "Documents retrieved successfully",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  data: z.array(
                    z.object({
                      id: z.number(),
                      title: z.string(),
                      type: z.string(),
                      uploadDate: z.string(),
                      size: z.string(),
                      quizCount: z.number(),
                      processingStatus: z.enum([
                        "pending",
                        "extracting_text",
                        "chunking",
                        "embedding",
                        "completed",
                        "failed",
                      ]),
                    }),
                  ),
                  pagination: z.object({
                    page: z.number(),
                    limit: z.number(),
                    totalItems: z.number(),
                    totalPages: z.number(),
                    hasNextPage: z.boolean(),
                    hasPreviousPage: z.boolean(),
                  }),
                }),
              ),
            },
          },
        },
      },
    }),
    zValidator(
      "json",
      z.object({
        query: z.string(),
        language: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(10),
      }),
    ),
    async (c) => {
      const { query, language = "english", page, limit } = c.req.valid("json");
      const supabase = getSupabase(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Create embeddings instance
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: c.env.OPENAI_API_KEY,
      });

      // Create hybrid search retriever
      const retriever = new SupabaseHybridSearch(embeddings, {
        client: supabase,
        similarityK: 2,
        keywordK: 2,
        tableName: "documents",
        similarityQueryName: "match_documents",
        keywordQueryName: "kw_match_documents",
      });

      // Get results
      const results = await retriever.invoke(query);

      // Apply pagination
      const totalItems = results.length;
      const totalPages = Math.ceil(totalItems / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = results.slice(startIndex, endIndex);

      const formattedResults = paginatedResults.map((result) => ({
        id: result.metadata.id,
        title: result.metadata.originalName.split(".").slice(0, -1).join("."),
        type: result.metadata.extension.toUpperCase(),
        uploadDate: format(new Date(result.metadata.createdAt), "MMM-dd-yyyy"),
        size: `${result.metadata.sizeInKb} KB`,
        quizCount: result.metadata.quizCount,
        processingStatus: result.metadata.processingStatus,
      }));

      return c.json({
        data: formattedResults,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page * limit < totalItems,
          hasPreviousPage: page > 1,
        },
      });
    },
  )
  .get(
    "/:id",
    describeRoute({
      tags: ["Documents"],
      summary: "Get a document by ID",
      description: "Get a document by its ID",
      validateResponse: true,
      responses: {
        200: {
          description: "Document retrieved successfully",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  id: z.number(),
                  userId: z.string().uuid(),
                  fileUrl: z.string(),
                  content: z.string(),
                  metadata: z.object({
                    originalName: z.string(),
                    contentType: z.string(),
                    extension: z.string(),
                    uploadTimestamp: z.string(),
                    size: z.number(),
                    sizeInKb: z.number(),
                    lastModified: z.string(),
                    storagePath: z.string(),
                    mimeType: z.string(),
                    uploadedBy: z.string(),
                    processingStatus: z.string(),
                    signedUrlExpiry: z.string(),
                  }),
                  createdAt: z.string(),
                  fileName: z.string(),
                  fileType: z.string(),
                  fileSize: z.number(),
                  pageCount: z.number(),
                  processingStatus: z.string(),
                  lastAccessed: z.string(),
                  quizCount: z.number(),
                  embedding: z.array(z.number()).nullable(),
                  documentId: z.string().uuid(),
                }),
              ),
            },
          },
        },
      },
    }),
    zValidator("param", z.object({ id: z.coerce.number() })),
    async (c) => {
      const { id } = c.req.valid("param");
      const db = await createDb(c);
      const document = await db.query.documents.findFirst({
        where: eq(documents.id, id),
      });

      return c.json(document);
    },
  );
export default documentsRoutes;
