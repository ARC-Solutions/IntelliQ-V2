import { Badge } from "./ui/badge";
import { motion } from "framer-motion";

export default function HNBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <Badge
        variant="outline"
        className="px-4 py-2 bg-[#121212]/80 backdrop-blur-sm border-[#2a2a2a] text-gray-300 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex items-center gap-2"
      >
        <span className="text-base">🧠</span>
        <span className="font-medium">HN Mode:</span>
        <span className="text-[#ff6600] font-semibold">
          Full Access Enabled
        </span>
        <span className="ml-1 h-2 w-2 rounded-full bg-[#ff6600] animate-pulse" />
      </Badge>
    </motion.div>
  );
}
