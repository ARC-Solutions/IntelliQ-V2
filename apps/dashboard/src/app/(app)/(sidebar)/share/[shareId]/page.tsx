"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { createApiClient } from "@/utils/api-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/format-time";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  Tag,
  BookOpen,
  Globe,
  EyeOff,
} from "lucide-react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";

interface SharedQuiz {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    topic: string[] | null;
    tags: string[] | null;
    passingScore: number | null;
    type: string;
    createdAt: string;
    language: string;
    userScore: number | null;
    correctAnswersCount: number | null;
    questionsCount: number;
    totalTimeTaken: number | null;
    passed: boolean | null;
    createdBy: string;
    generatedTags?: string[] | null;
    generatedCategories?: string[] | null;
    timeLimit?: number;
  };
  shareId: string;
  shareUrl: string;
  isPublic: boolean;
  isAnonymous: boolean;
  type: string;
  multiplayerSubmission?: {
    id: string;
    userId: string;
    quizId: string;
    roomId: string;
    userScore: number;
    correctAnswersCount: number;
    createdAt: string;
  } | null;
}

export default function SharedQuizPage({
  params,
}: { params: { shareId: string } }) {
  const [quiz, setQuiz] = useState<SharedQuiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const fetchSharedQuiz = async () => {
      try {
        const client = createApiClient();
        const response = await client.api.v1.share[":shareId"].$get({
          param: { shareId: params.shareId },
        });

        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error("Failed to fetch shared quiz");
        }

        const data = await response.json();
        setQuiz(data);
      } catch (err) {
        console.error("Error fetching shared quiz:", err);
        setError("Failed to load quiz");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedQuiz();
  }, [params.shareId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              Error Loading Quiz
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>{error || "Failed to load quiz details"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { type } = quiz;
  const isMultiplayer = type === "multiplayer";

  const userScore = isMultiplayer
    ? quiz.multiplayerSubmission?.userScore || 0
    : quiz.quiz.userScore || 0;

  const correctAnswersCount = isMultiplayer
    ? quiz.multiplayerSubmission?.correctAnswersCount || 0
    : quiz.quiz.correctAnswersCount || 0;

  const questionsCount = quiz.quiz.questionsCount;

  const totalTimeTaken = isMultiplayer
    ? quiz.quiz.timeLimit || 0 // Fallback to the quiz time limit
    : quiz.quiz.totalTimeTaken || 0;

  const passed = isMultiplayer
    ? userScore >= (quiz.quiz.passingScore || 0)
    : quiz.quiz.passed;

  const progressValue = (correctAnswersCount / questionsCount) * 100;

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex w-full flex-col px-6 py-8 text-gray-800 sm:w-10/12 max-w-5xl">
        <header className="mb-10 flex w-full flex-col items-center justify-center">
          <Image
            src={resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo.svg"}
            alt="IntelliQ"
            width={250}
            height={250}
          />

          <h1 className="text-2xl font-bold sm:text-4xl text-primary mt-4">
            {quiz.quiz.title}
          </h1>
        </header>

        <Card className="w-full border-b-[0.5px] border-gray-300 shadow-md p-4 text-black dark:text-white">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Award size={40} className="text-primary" />
                <div className="flex flex-col">
                  <span className="text-xl">Score</span>
                  <span className="text-primary text-4xl font-bold">
                    {isMultiplayer ? userScore : `${userScore}%`}
                  </span>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                {!isMultiplayer && (
                  <div className="flex items-center gap-2">
                    <Clock className="text-primary" />
                    <div className="flex flex-col">
                      <span className="text-lg">Total Time</span>
                      <span className="text-primary text-2xl font-semibold">
                        {formatTime(totalTimeTaken)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-primary" />
                  <div className="flex flex-col">
                    <span className="text-lg">Correct Answers</span>
                    <span className="text-primary text-2xl font-semibold">
                      {correctAnswersCount}/{questionsCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col justify-between items-center px-6 gap-4">
            <Progress
              className="w-full mb-4 outline outline-1 outline-slate-600 h-3"
              value={progressValue}
            />
            {!isMultiplayer && (
              <h4 className="text-xl text-primary font-semibold">
                {passed ? "PASSED!" : "FAILED!"}
              </h4>
            )}
            {quiz.quiz.description && (
              <span className="text-lg text-gray-800 text-center">
                {quiz.quiz.description}
              </span>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-primary" size={18} />
                  <span className="text-lg font-medium">Topic:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quiz.quiz.topic?.map((topic) => (
                    <Badge key={topic} variant="primary" className="text-sm">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Tag className="text-primary" size={18} />
                  <span className="text-lg font-medium">Tags:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quiz.quiz.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                  {quiz.quiz.generatedTags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-sm bg-primary/20"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>

          <Separator className="my-6 bg-white/10" />

          <CardFooter className="flex flex-col gap-4 px-6">
            <div className="flex flex-wrap justify-between w-full gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-primary" size={16} />
                <span className="text-sm">
                  Created: {new Date(quiz.quiz.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <User className="text-primary" size={16} />
                <span className="text-sm">Quiz Type: {quiz.quiz.type}</span>
              </div>

              {!isMultiplayer && (
                <div className="flex items-center gap-2">
                  <Award className="text-primary" size={16} />
                  <span className="text-sm">
                    Passing Score: {quiz.quiz.passingScore}%
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {quiz.isPublic ? (
                  <Globe className="text-primary" size={16} />
                ) : (
                  <EyeOff className="text-primary" size={16} />
                )}
                <span className="text-sm">
                  {quiz.isPublic ? "Public" : "Private"} Quiz
                </span>
              </div>
            </div>

            {!quiz.isAnonymous && (
              <div className="flex items-center gap-2 mt-2">
                <User className="text-primary" size={16} />
                <span className="text-sm">
                  Shared by: {quiz.quiz.createdBy}
                </span>
              </div>
            )}
          </CardFooter>
        </Card>

        {/* {quiz.quiz.generatedCategories && quiz.quiz.generatedCategories.length > 0 && (
          <Card className="w-full mt-6 border-b-[0.5px] border-white border-opacity-[.15] p-4 bg-black text-white">
            <CardHeader>
              <CardTitle className="text-xl">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {quiz.quiz.generatedCategories.map((category) => (
                  <Badge key={category} variant="secondary" className="text-sm">
                    {category}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )} */}
      </div>
    </div>
  );
}
