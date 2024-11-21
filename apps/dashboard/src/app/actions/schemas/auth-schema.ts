import { z } from "zod";

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  token: z.string(),
});
