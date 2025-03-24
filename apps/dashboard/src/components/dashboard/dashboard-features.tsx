"use client";
import { useQuiz } from "@/contexts/quiz-context";
import { cn } from "@/lib/utils";
import { Dices, Paperclip, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { BentoGrid, BentoGridItem } from "../ui/bento-grid";

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
    <BentoGrid className="max-w-4xl mx-auto md:auto-rows-[20rem] md:grid-cols-3">
      {items.map((item, i) => (
        <div key={i} className={cn("h-full", item.className)}>
            <Link href={item.url} className="block h-full">
              <BentoGridItem
                title={item.title}
                description={item.description}
                header={item.header}
                className="h-full"
                icon={item.icon}
                isPdfUpload={item.isPdfUpload}
              />
          </Link>
        </div>
      ))}
    </BentoGrid>
  );
}
const Skeleton = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl dark:bg-dot-white/[0.2] bg-dot-black/[0.2] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]  border border-transparent dark:border-white/[0.2] bg-neutral-100 dark:bg-black" />
);

const items = [
  {
    title: "Quiz Me",
    description: "Challenge yourself to a quiz with a topic of your choice.",
    header: <Skeleton />,
    className: "md:col-span-1 cursor-pointer",
    icon: <UserRound className="w-4 h-4 text-neutral-500" />,
    url: "/single-player/quiz",
  },
  {
    title: "Multiplayer",
    description:
      "Compete with friends as AI generates topic-based questions. Join or create a lobby and see who's the quickest to win!",
    header: <Skeleton />,
    className: "md:col-span-2 cursor-pointer",
    icon: <UsersRound className="w-4 h-4 text-neutral-500" />,
    url: "/multiplayer",
  },
  {
    title: "Get quizzed on your PDF",
    description:
      "Upload a file by dragging, dropping, or clicking, and let AI generate quiz questions based on the content.",
    className: "md:col-span-2",
    icon: <Paperclip className="w-4 h-4 text-neutral-500" />,
    url: "/documents",
    customRender: true,
    header: null,
    isPdfUpload: true,
  },
  {
    title: "Random",
    description: "Get quizzed on completely random topics.",
    header: <Skeleton />,
    className: "md:col-span-1 cursor-pointer",
    icon: <Dices className="w-4 h-4 text-neutral-500" />,
    url: "/random-quiz",
  },
];
