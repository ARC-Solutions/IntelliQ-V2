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
    .transform((tags) => {
      if (!tags) return undefined;
      // Handle both array and comma-separated string
      const tagArray =
        typeof tags === "string"
          ? tags.split(",").map((t) => t.trim())
          : Array.isArray(tags)
            ? tags
            : [tags];
      // Remove empty strings and duplicates
      return Array.from(new Set(tagArray.filter(Boolean)));
    }),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// Base fields that both types share
const baseQuizHistoryItem = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  score: z.number().nullable(),
  correct: z.number().nullable(),
  incorrect: z.number().nullable(),
  type: quizType,
});

// Singleplayer specific fields
const singleplayerQuizHistoryItem = baseQuizHistoryItem.extend({
  totalTime: z.string(),
  passed: z.boolean().optional(),
  type: z.literal(quizType.Enum.singleplayer),
});

// Multiplayer specific fields (only includes base fields)
const multiplayerQuizHistoryItem = baseQuizHistoryItem.extend({
  type: z.literal(quizType.Enum.multiplayer),
});

// Union type for quiz history items
const quizHistoryItem = z.discriminatedUnion("type", [
  singleplayerQuizHistoryItem,
  multiplayerQuizHistoryItem,
]);

// Full response schema including pagination
export const quizHistoryResponseSchema = z.object({
  data: z.array(quizHistoryItem),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});
