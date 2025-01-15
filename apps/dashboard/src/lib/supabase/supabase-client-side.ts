import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  if (!process.env.SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL is not defined");
  }
  if (!process.env.SUPABASE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_KEY is not defined");
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
