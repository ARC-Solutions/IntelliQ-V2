import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  try {
    const cookieStore = cookies();

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error("Missing Supabase environment variables");
    }

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            try {
              return cookieStore.getAll();
            } catch (e) {
              console.error("Error getting cookies:", e);
              return [];
            }
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (e) {
              console.error("Error setting cookies:", e);
            }
          },
        },
      }
    );
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    throw error;
  }
}
