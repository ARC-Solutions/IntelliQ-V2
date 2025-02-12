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
  offset: z.coerce.number().min(0).default(0),
});
