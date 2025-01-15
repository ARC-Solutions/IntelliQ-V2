import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export interface Env {
  // If you set another name in wrangler.toml as the value for 'binding',
  // replace "HYPERDRIVE" with the variable name you defined.
  HYPERDRIVE: Hyperdrive;
}

export async function createClient() {
  const cookieStore = cookies();
  const supabase_anon = (await getCloudflareContext()).env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase_url = (await getCloudflareContext()).env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabase_url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or ENV is not defined");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !supabase_anon) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY or ENV is not defined");
  }
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || supabase_url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || supabase_anon,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}