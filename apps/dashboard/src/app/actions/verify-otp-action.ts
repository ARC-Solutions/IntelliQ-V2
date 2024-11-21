"use server";

import { createClient } from "@/lib/supabase/supabase-server-side";
import { redirect } from "next/navigation";
import { actionClient } from "./safe-action";
import { verifyOtpSchema } from "./schemas/auth-schema";

export const verifyOtpAction = actionClient
  .schema(verifyOtpSchema)
  .action(async ({ parsedInput: { email, token } }) => {
    const supabase = createClient();

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      throw new Error(error.message);
    }

    redirect("/");
  });
