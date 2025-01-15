import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  
  if (!process.env.SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or ENV is not defined");
  }
  if (!process.env.SUPABASE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY or ENV is not defined");
  }
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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