"use client";

import { useQuiz } from "@/contexts/quiz-context";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Dices,
  FileText,
  Paperclip,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { BentoGrid, BentoGridItem } from "../ui/bento-grid";
import { motion } from "framer-motion";

export function DashboardFeatures() {
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

  return (
    <BentoGrid className="max-w-5xl mx-auto md:auto-rows-[20rem] md:grid-cols-3 gap-6">
      {items.map((item, i) => (
        <motion.div
          key={i}
          className={cn("h-full group", item.className)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
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
              cta={item.cta}
            />
          </Link>
        </motion.div>
      ))}
    </BentoGrid>
  );
}

const QuizMeSkeleton = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-card/50 hover:bg-gradient-to-br hover:from-[hsl(var(--primary)/0.15)] hover:to-[hsl(var(--primary)/0.25)] overflow-hidden relative transition-all duration-300">
    <div className="relative z-10 flex flex-col items-start justify-center w-full h-full p-6 space-y-4">
      <motion.div
        className="flex items-center space-x-2"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-10 h-10 rounded-full bg-gray-100/50 group-hover:bg-[hsl(var(--primary)/0.3)] flex items-center justify-center ring-1 ring-gray-200/50 group-hover:ring-[hsl(var(--primary)/0.5)] transition-all duration-300">
          <BookOpen className="w-6 h-6 text-gray-400/50 group-hover:text-[hsl(var(--primary))]" />
        </div>
        <motion.div
          className="h-2 w-32 bg-gray-100/50 group-hover:bg-[hsl(var(--primary)/0.3)] rounded-full"
          animate={{ width: [40, 120, 40] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      <motion.div
        className="flex flex-col w-full space-y-2"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={i}
            className="h-2 bg-gray-100/50 group-hover:bg-[hsl(var(--primary)/0.3)] rounded-full"
            style={{ width: `${100 - i * 20}%` }}
            animate={{
              width: [`${60 - i * 20}%`, `${100 - i * 20}%`, `${60 - i * 20}%`],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    </div>
  </div>
);

const MultiplayerSkeleton = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-card/50 hover:bg-gradient-to-br hover:from-[hsl(var(--primary)/0.15)] hover:to-[hsl(var(--primary)/0.25)] overflow-hidden relative transition-all duration-300">
    <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-6">
      <div className="flex items-center justify-center gap-6 mb-6">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center"
            initial={{ y: 0 }}
            animate={{
              y: [0, -10, 0],
              scale: i === 1 ? [1, 1.1, 1] : [1, 0.9, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          >
            <div
              className={cn(
                "rounded-full flex items-center justify-center transition-all duration-300",
                i === 1
                  ? "w-14 h-14 bg-gray-100/50 group-hover:bg-[hsl(var(--primary)/0.3)] ring-2 ring-gray-200/50 group-hover:ring-[hsl(var(--primary)/0.5)]"
                  : "w-12 h-12 bg-gray-100/50 group-hover:bg-[hsl(var(--primary)/0.3)] ring-1 ring-gray-200/50 group-hover:ring-[hsl(var(--primary)/0.5)]",
              )}
            >
              {i === 1 ? (
                <Trophy className="w-7 h-7 text-gray-400/50 group-hover:text-[hsl(var(--primary))]" />
              ) : (
                <UserRound className="w-6 h-6 text-gray-400/50 group-hover:text-[hsl(var(--primary))]" />
              )}
            </div>
            <motion.div
              className={cn(
                "mt-2 h-1 rounded-full",
                i === 1
                  ? "w-10 bg-gray-100/50 group-hover:bg-[hsl(var(--primary)/0.3)]"
                  : "w-8 bg-gray-100/50 group-hover:bg-[hsl(var(--primary)/0.3)]",
              )}
              animate={{ width: ["60%", "100%", "60%"] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

const PdfSkeleton = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-card/50 hover:bg-gradient-to-br hover:from-[hsl(var(--primary)/0.15)] hover:to-[hsl(var(--primary)/0.25)] overflow-hidden relative transition-all duration-300">
    <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-6">
      <motion.div
        className="w-24 h-32 bg-gray-100/50 group-hover:bg-[hsl(var(--primary)/0.3)] border border-gray-200/50 group-hover:border-[hsl(var(--primary)/0.5)] rounded-lg flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <FileText className="w-10 h-10 mb-4 text-gray-400/50 group-hover:text-[hsl(var(--primary))]" />
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="h-1 bg-gray-200/50 group-hover:bg-[hsl(var(--primary)/0.3)] rounded-full mb-2"
            style={{ width: `${60 - i * 10}%` }}
            animate={{
              width: [`${40 - i * 10}%`, `${60 - i * 10}%`, `${40 - i * 10}%`],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>

      <motion.div
        className="flex items-center mt-4 space-x-2"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Paperclip className="w-4 h-4 text-gray-400/50 group-hover:text-[hsl(var(--primary))]" />
        <motion.div
          className="h-1 w-20 bg-gray-100/50 group-hover:bg-[hsl(var(--primary)/0.3)] rounded-full"
          animate={{ width: [40, 80, 40] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </div>
  </div>
);

const RandomSkeleton = () => {
  const [numbers, setNumbers] = useState([0, 0, 0]);

  useEffect(() => {
    setNumbers([
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ]);
  }, []);

  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-card/50 hover:bg-gradient-to-br hover:from-[hsl(var(--primary)/0.15)] hover:to-[hsl(var(--primary)/0.25)] overflow-hidden relative transition-all duration-300">
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-6">
        <motion.div
          className="w-20 h-20 rounded-full bg-gray-100/50 group-hover:bg-[hsl(var(--primary)/0.3)] flex items-center justify-center mb-4 ring-1 ring-gray-200/50 group-hover:ring-[hsl(var(--primary)/0.5)] transition-all duration-300"
          animate={{
            rotate: [0, 360],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <Dices className="w-10 h-10 text-gray-400/50 group-hover:text-[hsl(var(--primary))]" />
        </motion.div>

        <div className="flex gap-3">
          {numbers.map((num, i) => (
            <motion.div
              key={i}
              className="w-8 h-8 rounded bg-gray-100/50 group-hover:bg-[hsl(var(--primary)/0.3)] flex items-center justify-center text-sm font-bold text-gray-400/50 group-hover:text-[hsl(var(--primary))] ring-1 ring-gray-200/50 group-hover:ring-[hsl(var(--primary)/0.5)] transition-all duration-300"
              initial={{ y: 0 }}
              animate={{
                y: [0, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            >
              {num}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const items = [
  {
    title: "Quiz Me",
    description:
      "Challenge yourself with personalized quizzes on any topic of your choice.",
    header: <QuizMeSkeleton />,
    className: "md:col-span-1 cursor-pointer",
    icon: <BookOpen className="w-4 h-4" />,
    url: "/single-player/quiz",
  },
  {
    title: "Multiplayer Challenge",
    description:
      "Compete with friends in real-time as AI generates questions. Race to the top of the leaderboard!",
    header: <MultiplayerSkeleton />,
    className: "md:col-span-2 cursor-pointer",
    icon: <Users className="w-4 h-4" />,
    url: "/multiplayer",
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
  },
  {
    title: "Random Challenge",
    description:
      "Test your knowledge with completely random topics. You never know what you'll get!",
    header: <RandomSkeleton />,
    className: "md:col-span-1 cursor-pointer",
    icon: <Dices className="w-4 h-4" />,
    url: "/random-quiz",
  },
];
