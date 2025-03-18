import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { getSupabase } from "../middleware/auth.middleware";
import { bearerAuth } from "hono/bearer-auth";
import { createDb } from "../../../db/index";
import { documents } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";

const adminDocumentsRoutes = new Hono<{ Bindings: CloudflareEnv }>().post(
  "/process",
  bearerAuth({ verifyToken: (token, c) => token === c.env.ADMIN_TOKEN }),
  describeRoute({
    tags: ["Documents"],
    summary: "Process a document",
    description: "Process a document",
  }),
  async (c) => {
    const { documentId, fileName, fileType } = await c.req.json();

    const db = await createDb(c);
    await db
      .update(documents)
      .set({
        processingStatus: "extracting_text",
      })
      .where(eq(documents.id, documentId));

    const supabase = getSupabase(c);
    const { data: fileData, error: fileError } = await supabase.storage
      .from("documents")
      .download(fileName);

    if (fileError) {
      console.error("File download error:", fileError);
      await db
        .update(documents)
        .set({ processingStatus: "failed" })
        .where(eq(documents.id, documentId));
      throw new HTTPException(500, { message: fileError.message });
    }

    let documentText = "";
    let pageCount = 0;

    try {
      const blob = new Blob([fileData], { type: `application/${fileType}` });

      switch (fileType) {
        case "pdf": {
          const pdf = new PDFLoader(blob);
          const docs = await pdf.load();
          documentText = docs.map((doc) => doc.pageContent).join("\n");
          pageCount = docs.length;
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

      await db
        .update(documents)
        .set({
          processingStatus: "embedding",
          metadata: {
            // Get existing metadata
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
          },
        })
        .where(eq(documents.id, documentId));

      // Generate embedding for document indexing
      // We'll use the first chunk as a representative embedding for the document
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: c.env.OPENAI_API_KEY,
        modelName: "text-embedding-3-small",
      });

      const embedding = await embeddings.embedQuery(chunks[0]);

      // Store all chunks in document metadata for quiz generation
      await db
        .update(documents)
        .set({
          embedding,
          processingStatus: "completed",
          metadata: {
            ...((
              await db.query.documents.findFirst({
                where: eq(documents.id, documentId),
                columns: { metadata: true },
              })
            )?.metadata || {}),
            chunks: chunks.slice(0, 20), // Store up to 20 chunks for quiz generation
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
