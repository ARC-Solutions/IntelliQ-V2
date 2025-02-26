"use client";
import { cn } from "@/lib/utils";
import React, { useEffect } from "react";
import { BentoGrid, BentoGridItem } from "../ui/bento-grid";
import { UserRound, UsersRound, Paperclip, Dices } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { useQuiz } from "@/contexts/quiz-context";
import { useAuth } from "@/contexts/user-context";

export function DashboardFeatures() {
  const { currentQuiz } = useQuiz();
  const router = useRouter();

  useEffect(() => {
    if (currentQuiz) {
      redirect("/single-player/quiz/play");
    }
  }, [currentQuiz]);

  return (
    <div className="w-full py-12">
      <BentoGrid className="max-w-4xl mx-auto">
        {items.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            header={item.header}
            className={item.className}
            icon={item.icon}
            onClick={item.url ? () => router.push(item.url!) : undefined}
          />
        ))}
      </BentoGrid>
    </div>
  );
}

const Skeleton = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl dark:bg-dot-white/[0.2] bg-dot-black/[0.2] [mask-image:radial-gradient(ellipse_at_center,white,transparent)] border border-transparent dark:border-white/[0.2] bg-neutral-100 dark:bg-black"></div>
);

const items = [
  {
    title: "Quiz Me",
    description: "Challenge yourself to a quiz with a topic of your choice.",
    header: <Skeleton />,
    className: "md:col-span-1 cursor-pointer",
    icon: <UserRound className="h-4 w-4 text-neutral-500" />,
    url: "/single-player/quiz",
  },
  {
    title: "Multiplayer",
    description:
      "Compete with friends as AI generates topic-based questions. Join or create a lobby and see who's the quickest to win!",
    header: <Skeleton />,
    className: "md:col-span-2 cursor-pointer",
    icon: <UsersRound className="h-4 w-4 text-neutral-500" />,
    url: "/multiplayer",
  },
  {
    title: "Get quizzed on your PDF",
    description:
      "Upload a file by dragging, dropping, or clicking, and let AI generate quiz questions based on the content.",
    header: <Skeleton />,
    className: "md:col-span-2",
    icon: <Paperclip className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Random",
    description: "Get quizzed on completely random topics.",
    header: <Skeleton />,
    className: "md:col-span-1 cursor-pointer",
    icon: <Dices className="h-4 w-4 text-neutral-500" />,
    url: "/random-quiz",
  },
];
