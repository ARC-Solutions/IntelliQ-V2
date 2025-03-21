"use client";
import { useQuiz } from "@/contexts/quiz-context";
import { cn } from "@/lib/utils";
import { Dices, Paperclip, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { BentoGridItem } from "../ui/bento-grid";

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
    <div className="h-screen w-full overflow-hidden">
      <div className="max-w-4xl mx-auto h-full overflow-y-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
          {items.map((item, i) => (
            <div key={i} className="h-[20rem]">
              {item.url && !item.customRender ? (
                <Link href={item.url} className="h-full block">
                  <BentoGridItem
                    title={item.title}
                    description={item.description}
                    header={item.header}
                    className={cn("h-full", item.className)}
                    icon={item.icon}
                    url={item.url}
                  />
                </Link>
              ) : item.customRender && item.url ? (
                <Link href={item.url} className="h-full block">
                  <BentoGridItem
                    title={item.title}
                    description={item.description}
                    header={item.header}
                    className={cn("h-full", item.className)}
                    icon={item.icon}
                  />
                </Link>
              ) : (
                <BentoGridItem
                  title={item.title}
                  description={item.description}
                  header={item.header}
                  className={cn("h-full", item.className)}
                  icon={item.icon}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
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
    className: "md:col-span-1 h-full",
    icon: <UserRound className="h-4 w-4 text-neutral-500" />,
    url: "/single-player/quiz",
  },
  {
    title: "Multiplayer",
    description:
      "Compete with friends as AI generates topic-based questions. Join or create a lobby and see who's the quickest to win!",
    header: <Skeleton />,
    className: "md:col-span-1 h-full",
    icon: <UsersRound className="h-4 w-4 text-neutral-500" />,
    url: "/multiplayer",
  },
  {
    title: "Get quizzed on your PDF",
    description:
      "Upload a file by dragging, dropping, or clicking, and let AI generate quiz questions based on the content.",
    header: <Skeleton />,
    className: "md:col-span-1",
    icon: <Paperclip className="h-4 w-4 text-neutral-500" />,
    url: "/documents",
    customRender: true,
  },
  {
    title: "Random",
    description: "Get quizzed on completely random topics.",
    header: <Skeleton />,
    className: "md:col-span-1",
    icon: <Dices className="h-4 w-4 text-neutral-500" />,
    url: "/random-quiz",
  },
];
