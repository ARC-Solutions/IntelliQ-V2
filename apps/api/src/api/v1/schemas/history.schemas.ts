import { z } from "zod";
import { quizType } from "./common.schemas";

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

export const quizHistoryItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  score: z.number(),
  totalTime: z.string(),
  date: z.string(),
  correct: z.number(),
  incorrect: z.number(),
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
