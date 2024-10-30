"use client";

import { useLocalStorage } from "usehooks-ts";

const useLastUsed = () => {
  return useLocalStorage<"google" | "email" | undefined>(
    "last_intelliq_login",
    undefined
  );
};

const LastUsed = () => {
  return (
    <span className="absolute right-4 text-xs text-white/60">Last used</span>
  );
};

export { useLastUsed, LastUsed };
