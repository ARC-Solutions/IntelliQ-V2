"use client";
import { createClient } from "@/lib/supabase/supabase-client-side";
import { SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

type SupabaseContext = {
  supabase: SupabaseClient;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export const SupabaseProvider = ({
  children,
}: { children: React.ReactNode }) => {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED"
      ) {
        router.refresh();
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);
  return (
    <Context.Provider value={{ supabase }}>
      <>{children}</>
    </Context.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(Context);

  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider");
  }
  return context;
};
