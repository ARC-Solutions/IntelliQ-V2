import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { describeRoute } from "hono-openapi";
import { getSupabase } from "./middleware/auth.middleware";
import { documents } from "../../../drizzle/schema";
import { createDb } from "../../db/index";
import { Client } from "@upstash/qstash";
import { z } from "zod";
import { resolver } from "hono-openapi/zod";

const ALLOWED_TYPES = new Map([
  ["pdf", "application/pdf"],
  //   ["doc", "application/msword"],
  //   [
  //     "docx",
  //     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  //   ],
  //   ["txt", "text/plain"],
]);

const documentsRoutes = new Hono<{ Bindings: CloudflareEnv }>().post(
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
    const file = formData["fileName"] as File;

    // if (!file) {
    //   throw new HTTPException(400, { message: "No file provided" });
    // }

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
);

export default documentsRoutes;
