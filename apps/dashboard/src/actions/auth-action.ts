"use server";

import { createClient } from "@/lib/supabase/supabase-server-side";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface UserInput {
  email: string;
  firstName: string;
  lastName: string;
}

export async function signInWithOTP(formData: FormData) {
  const supabase = createClient();

  // TODO TYPESAFETY
  const email = formData.get("email") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const isNewUser = formData.get("isNewUser") === "true";

  const options = {
    shouldCreateUser: isNewUser,
    ...(isNewUser
      ? {
          data: {
            email: email,
            name: `${firstName} ${lastName}`,
          },
        }
      : {}),
  };

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: options,
  });

  if (error) {
    return { error: error.message };
  }

  return { message: "OTP sent to email" };
}

export async function verifyOTP(formData: FormData) {
  const supabase = createClient();

  const email = formData.get("email") as string;
  const otp = formData.get("otp") as string;

  const { error, data } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: "email",
  });

  if (error) {
    return { error: error.message };
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signInWithGoogle() {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/`,
    },
  });

  if (error) {
    return { error: error.message };
  }
}

export async function signOut() {
  const supabase = createClient();
  console.log("Signing out");
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
