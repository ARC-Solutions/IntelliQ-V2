"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { LinkIcon } from "@/components/ui/link";
import { CheckCheckIcon } from "@/components/ui/check-check";
import { useToast } from "@/components/ui/use-toast";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

export const InviteButton = () => {
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const { isCopied, copyToClipboard } = useCopyToClipboard({
    timeout: 2000,
    onCopy: () => {
      toast({
        title: "Invite link copied!",
        description: "Share this link with others to join the quiz.",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "Failed to copy invite link",
        description: "Please try again",
        variant: "destructive",
      });
    }
  });

  const handleCopy = () => {
    const joinLink = `${window.location.origin}${window.location.pathname}`;
    copyToClipboard(joinLink);
  };

  return (
    <Button
      variant="outline"
      className="bg-primary/10 border-primary/20 text-primary min-w-[140px] flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCopy}
    >
      <AnimatePresence mode="wait">
        {!isCopied ? (
          <motion.div
            key="link"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <LinkIcon isAnimating={isHovered} />
          </motion.div>
        ) : (
          <motion.div
            key="check"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <CheckCheckIcon isAnimating={true} />
          </motion.div>
        )}
      </AnimatePresence>
      {isCopied ? "INVITED" : "INVITE"}
    </Button>
  );
};
