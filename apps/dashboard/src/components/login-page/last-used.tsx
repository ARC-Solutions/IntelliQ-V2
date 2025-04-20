"use client";

import { useLocalStorage } from "usehooks-ts";
import { motion } from "framer-motion";

const useLastUsed = () => {
  return useLocalStorage<"google" | "email" | undefined>(
    "last_intelliq_login",
    undefined,
  );
};

const LastUsed = () => {
  return (
    <motion.span
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        x: { type: "spring", damping: 15 },
      }}
      className="absolute right-4 -top-2.5 text-xs bg-white/95 
        border border-white/20 px-2 py-0.5 rounded-md shadow-sm backdrop-blur-[2px]
        text-gray-600 pointer-events-none"
    >
      Last used
    </motion.span>
  );
};

export { useLastUsed, LastUsed };
