import { z } from "zod";

export const userInputSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(3, "First name is required"),
  lastName: z.string().min(3, "Last name is required"),
});

export type UserInput = z.infer<typeof userInputSchema>;

export const otpFormSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(6, "OTP must be at least 6 characters"),
});

export type OTPForm = z.infer<typeof otpFormSchema>;
