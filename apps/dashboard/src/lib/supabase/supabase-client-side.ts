import { createBrowserClient } from "@supabase/ssr";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export function createClient() {
  if (!process.env.SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or URL is not defined");
  }
  if (!process.env.SUPABASE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY or ANON is not defined");
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
