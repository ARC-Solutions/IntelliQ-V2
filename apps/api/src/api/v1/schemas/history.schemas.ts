import { z } from "zod";
import { quizType } from "./common.schemas";

// REQUEST api/v1/history?type=singleplayer&status=true&tags=tag1,tag2&page=1&limit=10
export const historyQuerySchema = z.object({
  type: quizType.optional(),
  status: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (typeof val === "string") {
        return val.toLowerCase() === "true";
      }
      return val;
    }),
  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((tags) =>
      tags ? (Array.isArray(tags) ? tags : [tags]) : undefined
    ),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// RESPONSE api/v1/history
// ?type=singleplayer&status=true&tags=tag1,tag2&page=1&limit=10
export const quizHistoryItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  score: z.number().nullable(),
  totalTime: z.string(),
  date: z.string(),
  correct: z.number().nullable(),
  incorrect: z.number().nullable(),
});

export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const quizHistoryResponseSchema = z.object({
  data: z.array(quizHistoryItemSchema),
  pagination: paginationSchema,
});
