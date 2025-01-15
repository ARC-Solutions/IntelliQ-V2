import { createBrowserClient } from "@supabase/ssr";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function createClient() {
  const supabase_anon = (await getCloudflareContext()).env
    .NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase_url = (await getCloudflareContext()).env
    .NEXT_PUBLIC_SUPABASE_URL;
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabase_url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or URL is not defined");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !supabase_anon) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY or ANON is not defined");
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || supabase_url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabase_anon
  );
}
