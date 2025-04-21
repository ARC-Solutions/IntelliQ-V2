"use client";

import { useQuiz } from "@/contexts/quiz-context";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BookOpen, Dices, Lock, Paperclip, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { BentoGrid, BentoGridItem } from "../ui/bento-grid";
import {
  MultiplayerSkeleton,
  PdfSkeleton,
  QuizMeSkeleton,
  RandomSkeleton,
} from "./dashboard-features-skeleton";
import HNBadge from "../hn-badge";

interface FeatureFlags {
  singlePlayerEnabled: boolean;
  multiplayerEnabled: boolean;
  documentsEnabled: boolean;
  bookmarksEnabled: boolean;
  randomQuizEnabled: boolean;
  hnModeEnabled: boolean;
}

export function DashboardFeatures({
  featureFlags,
}: { featureFlags: FeatureFlags }) {
  const {
    isLoading,
    fetchingFinished: finished,
    currentQuiz,
    dispatch,
    summaryQuiz,
    isMultiplayerMode,
  } = useQuiz();

  useEffect(() => {
    if (currentQuiz) {
      const url = "/single-player/quiz/play";
      redirect(url);
    }
  }, [currentQuiz, summaryQuiz, isMultiplayerMode]);

  const items = [
    {
      title: "Quiz Me",
      description:
        "Challenge yourself with personalized quizzes on any topic of your choice.",
      header: <QuizMeSkeleton />,
      className: "md:col-span-1 cursor-pointer",
      icon: <BookOpen className="w-4 h-4" />,
      url: "/single-player/quiz",
      locked: !featureFlags.singlePlayerEnabled,
    },
    {
      title: "Multiplayer Challenge",
      description:
        "Compete with friends in real-time as AI generates questions. Race to the top of the leaderboard!",
      header: <MultiplayerSkeleton />,
      className: "md:col-span-2 cursor-pointer",
      icon: <Users className="w-4 h-4" />,
      url: "/multiplayer",
      locked: !featureFlags.multiplayerEnabled,
    },
    {
      title: "PDF Knowledge Quiz",
      description:
        "Upload your documents and let AI create custom quizzes based on your content. Perfect for studying!",
      className: "md:col-span-2",
      icon: <Paperclip className="w-4 h-4" />,
      url: "/documents",
      customRender: true,
      header: <PdfSkeleton />,
      isPdfUpload: true,
      locked: !featureFlags.documentsEnabled,
    },
    {
      title: "Random Challenge",
      description:
        "Test your knowledge with completely random topics. You never know what you'll get!",
      header: <RandomSkeleton />,
      className: "md:col-span-1 cursor-pointer",
      icon: <Dices className="w-4 h-4" />,
      url: "/random-quiz",
      locked: !featureFlags.randomQuizEnabled,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {/* Display HN Badge if HN mode is enabled */}
      {featureFlags.hnModeEnabled && (
        <div className="mb-16">
          <HNBadge />
        </div>
      )}
      <BentoGrid className="max-w-5xl mx-auto md:auto-rows-[20rem] md:grid-cols-3 gap-6 px-4 py-6 -mt-14">
        {items.map((item, i) => (
          <motion.div
            key={i}
            className={cn(
              "h-full group",
              item.className,
              item.locked ? "pointer-events-none" : "cursor-pointer",
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            whileHover={item.locked ? {} : { scale: 1.02 }}
            whileTap={item.locked ? {} : { scale: 0.98 }}
          >
            {item.locked ? (
              <div className="block h-full">
                <div className="relative h-full">
                  <BentoGridItem
                    title={item.title}
                    description={item.description}
                    header={item.header}
                    className={cn(
                      "h-full border border-border/40 bg-card/50 backdrop-blur-sm opacity-80",
                      "overflow-hidden relative group",
                    )}
                    icon={item.icon}
                    isPdfUpload={item.isPdfUpload}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[1px] rounded-xl">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-primary/80 to-primary/40 shadow-lg border border-primary/30 backdrop-blur-sm">
                      <Lock className="w-4 h-4" />
                      <span className="text-xs font-medium">Coming Soon</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link href={item.url} className="block h-full">
                <BentoGridItem
                  title={item.title}
                  description={item.description}
                  header={item.header}
                  className={cn(
                    "h-full border border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300",
                    "overflow-hidden relative group",
                  )}
                  icon={item.icon}
                  isPdfUpload={item.isPdfUpload}
                />
              </Link>
            )}
          </motion.div>
        ))}
      </BentoGrid>
    </div>
  );
}
