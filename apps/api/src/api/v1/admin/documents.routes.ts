import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { bearerAuth } from "hono/bearer-auth";
import { HTTPException } from "hono/http-exception";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { extractText, getDocumentProxy } from "unpdf";
import { documents } from "../../../../drizzle/schema";
import { createDb } from "../../../db/index";
import { z } from "zod";
import { resolver } from "hono-openapi/zod";
import { zValidator } from "@hono/zod-validator";

const adminDocumentsRoutes = new Hono<{ Bindings: CloudflareEnv }>()
.post(
  "/process",
  bearerAuth({ verifyToken: (token, c) => token === c.env.ADMIN_TOKEN }),
  describeRoute({
    tags: ["Documents"],
    summary: "Process a document",
    description: "Process a document",
    validateResponse: true,
    responses: {
      200: {
        description: "Document processed successfully",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                success: z.boolean(),
                message: z.string(),
                documentId: z.number(),
                pageCount: z.number(),
                textLength: z.number(),
                chunkCount: z.number(),
                embeddingType: z.string(),
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
      documentId: z.number(),
      fileType: z.string(),
    }),
  ),
  async (c) => {
    const { documentId, fileType } = c.req.valid("json");

    const db = await createDb(c);
    const document = await db.query.documents.findFirst({
      where: eq(documents.id, documentId),
      columns: {
        userId: true,
        metadata: true,
      },
    });

    if (!document) {
      throw new HTTPException(404, { message: "Document not found" });
    }

    const filePath = (document.metadata as { storagePath: string }).storagePath;

    await db
      .update(documents)
      .set({
        processingStatus: "extracting_text",
      })
      .where(eq(documents.id, documentId));

    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
        },
      },
    );

    const { data: fileData, error: fileError } = await supabase.storage
      .from("documents")
      .download(filePath);

    if (fileError) {
      console.error("File download error:", {
        error: fileError,
        message: fileError.message,
        filePath,
        storedPath: (document.metadata as { storagePath: string }).storagePath,
        documentId,
        userId: document.userId,
      });
      await db
        .update(documents)
        .set({ processingStatus: "failed" })
        .where(eq(documents.id, documentId));
      throw new HTTPException(500, { message: fileError.message });
    }

    let documentText = "";
    let pageCount = 0;

    try {
      const blob = new Blob([fileData], {
        type: `application/${fileType.toLowerCase()}`,
      });

      switch (fileType.toLowerCase()) {
        case "pdf": {
          const buffer = await blob.arrayBuffer();
          const pdf = await getDocumentProxy(new Uint8Array(buffer));
          const { totalPages, text } = await extractText(pdf, {
            mergePages: true,
          });
          documentText = text;
          pageCount = totalPages;
          break;
        }
        case "docx": {
          const loader = new DocxLoader(blob);
          const docs = await loader.load();
          documentText = docs.map((doc) => doc.pageContent).join("\n");
          pageCount = 1;
          break;
        }
        case "txt": {
          const loader = new TextLoader(blob);
          const docs = await loader.load();
          documentText = docs.map((doc) => doc.pageContent).join("\n");
          pageCount = 1;
          break;
        }
        default:
          throw new HTTPException(400, { message: "Unsupported file type" });
      }

      await db
        .update(documents)
        .set({
          content: documentText,
          pageCount,
          processingStatus: "chunking",
        })
        .where(eq(documents.id, documentId));
    } catch (error) {
      console.error("Error processing document:", error);
      await db
        .update(documents)
        .set({ processingStatus: "failed" })
        .where(eq(documents.id, documentId));
      throw new HTTPException(500, { message: "Error processing document" });
    }

    try {
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
        separators: ["\n\n", "\n", " ", ""],
      });
      const chunks = await textSplitter.splitText(documentText);
      const documentSizeKB = Buffer.from(documentText).length / 1024;

      //   Generate embedding for document indexing
      //   use the first chunk as a representative embedding for the document
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: c.env.OPENAI_API_KEY,
        modelName: "text-embedding-3-small",
      });

      let documentEmbeddings: number[];

      if (documentSizeKB <= 50) {
        documentEmbeddings = await embeddings.embedQuery(chunks[0]);
      } else {
        // For larger documents, get embeddings from start, middle, and end
        const startChunk = chunks[0];
        const middleChunk = chunks[Math.floor(chunks.length / 2)];
        const endChunk = chunks[chunks.length - 1];

        const [startEmbedding, middleEmbedding, endEmbedding] =
          await Promise.all([
            embeddings.embedQuery(startChunk),
            embeddings.embedQuery(middleChunk),
            embeddings.embedQuery(endChunk),
          ]);

        // Store the position information in metadata instead
        await db
          .update(documents)
          .set({
            processingStatus: "embedding",
            metadata: {
              ...((
                await db.query.documents.findFirst({
                  where: eq(documents.id, documentId),
                  columns: { metadata: true },
                })
              )?.metadata || {}),
              chunkCount: chunks.length,
              chunking: {
                chunkSize: 1000,
                chunkOverlap: 200,
                totalChunks: chunks.length,
              },
              chunks: documentSizeKB <= 50 ? chunks : chunks.slice(0, 20),
              documentSizeKB,
              embeddingPositions: {
                start: 0,
                middle: startEmbedding.length,
                end: startEmbedding.length + middleEmbedding.length,
              },
            },
          })
          .where(eq(documents.id, documentId));

        // Concatenate the embeddings
        documentEmbeddings = [
          ...startEmbedding,
          ...middleEmbedding,
          ...endEmbedding,
        ];
      }

      await db
        .update(documents)
        .set({
          embedding: documentEmbeddings,
          processingStatus: "completed",
          metadata: {
            ...((
              await db.query.documents.findFirst({
                where: eq(documents.id, documentId),
                columns: { metadata: true },
              })
            )?.metadata || {}),
            processingCompleted: new Date().toISOString(),
          },
        })
        .where(eq(documents.id, documentId));

      return c.json(
        {
          success: true,
          message: "Document processed successfully",
          documentId,
          pageCount,
          textLength: documentText.length,
          chunkCount: chunks.length,
          embeddingType: documentSizeKB <= 50 ? "single" : "multiple",
        },
        200,
      );
    } catch (error) {
      console.error("Error chunking document:", error);
      await db
        .update(documents)
        .set({ processingStatus: "failed" })
        .where(eq(documents.id, documentId));
      throw new HTTPException(500, {
        message: "Error processing document chunks",
      });
    }
  },
);

export default adminDocumentsRoutes;
