import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  let cookieStore;

  try {
    cookieStore = cookies();
  } catch (e) {
    console.warn(
      "Unable to access cookies, falling back to empty cookie store"
    );
    cookieStore = {
      getAll: () => [],
      set: () => {},
      get: () => undefined,
    };
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          try {
            return cookieStore.get(name)?.value;
          } catch (e) {
            return undefined;
          }
        },
        set(name, value, options) {
          try {
            cookieStore.set(name, value, options);
          } catch (e) {
            console.warn("Unable to set cookie:", e);
          }
        },
        remove(name, options) {
          try {
            cookieStore.set(name, "", { ...options, maxAge: 0 });
          } catch (e) {
            console.warn("Unable to remove cookie:", e);
          }
        },
      },
    }
  );
}
