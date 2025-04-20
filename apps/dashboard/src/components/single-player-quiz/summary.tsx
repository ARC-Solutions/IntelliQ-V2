'use client';
import { useEffect, useRef, useState } from 'react';
import { useQuiz } from '@/contexts/quiz-context';
import type { HistoryQuestions } from '@/contexts/quiz-context';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTime } from '@/lib/format-time';
import QuestionsList from './summary-questions';
import Image from 'next/image';
import { Award, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Progress } from '../ui/progress';
import { useQuizCreation } from '@/contexts/quiz-creation-context';
import type { QuizData } from '@/contexts/quiz-creation-context';
import { QuizType } from '@intelliq/api';
import Lottie from 'lottie-react';
import Loading from '@/assets/loading.json';
import LoadingDark from '@/assets/loading-dark.json';
import { useTheme } from 'next-themes';
import { useLocalStorage } from 'usehooks-ts';
import ReactConfetti from 'react-confetti';
import { useRouter } from 'next/navigation';

const Summary = () => {
  const { dispatch, summaryQuiz, fetchQuestions, isLoading, currentQuiz } = useQuiz();
  const { resolvedTheme } = useTheme();
  const { formValues } = useQuizCreation();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [replay, setReplay] = useState<boolean>(false);
  const [soundEnabled] = useLocalStorage<boolean>('soundEnabled', true);
  const [particlesEnabled] = useLocalStorage<boolean>('particlesEnabled', true);
  const router = useRouter();

  const successSound = typeof window !== 'undefined' ? new Audio('/success.mp3') : null;

  useEffect(() => {
    setIsMounted(true);
    // Only reset quiz if summary data exists to prevent redirect loops
    if (summaryQuiz) {
      dispatch({ type: 'RESET_QUIZ' });
    }
    setReplay(false);
  }, []);

  useEffect(() => {
    // Play success sound if user passed and component is mounted
    if (
      isMounted &&
      summaryQuiz &&
      (correctAnswersCount / totalQuestions) * 100 >= summaryQuiz.passingScore
    ) {
      if (soundEnabled) {
        successSound!.play().catch((err) => {
          console.error('Error playing success sound:', err);
        });
      }
    }
  }, [isMounted]);

  // Move redirect to useEffect to prevent render-time redirects
  useEffect(() => {
    // Check if component is mounted before redirecting
    if (isMounted && !summaryQuiz) {
      router.push('/', { scroll: false }); // Add scroll: false to prevent animation
    }
  }, [isMounted, summaryQuiz, router]);

  if (isLoading) {
    return (
      <div className='absolute left-1/2 top-1/2 flex w-[40] -translate-x-1/2 -translate-y-1/2 flex-col items-center md:w-[30vw]'>
        <Lottie animationData={resolvedTheme === 'dark' ? LoadingDark : Loading} />
      </div>
    );
  }

  if (!summaryQuiz) {
    return null; // Return null instead of showing loading animation
  }

  const correctAnswersCount = summaryQuiz.correctAnswersCount;
  const totalQuestions = summaryQuiz.totalQuestions;
  const correctPercentage = (correctAnswersCount / totalQuestions) * 100;
  const timeTaken = summaryQuiz.totalTime;

  // This will be modified once i work with the new database
  let descriptionText = '';
  if (correctPercentage >= summaryQuiz.passingScore) {
    descriptionText =
      '👏 Excellent work! Your understanding of the topic is impressive. Keep it up! 👏';
  } else if (correctPercentage > summaryQuiz.passingScore / 2) {
    descriptionText = '👍 Great job! Keep up the good work. 👍';
  } else {
    descriptionText = '😊 Nice try! Keep practicing to improve your score. 😊';
  }

  // Filter questions
  const allQuestions = summaryQuiz?.questions || [];
  const correctQuestions = allQuestions.filter(
    (q: HistoryQuestions) => q.userAnswer === q.correctAnswer,
  );
  const incorrectQuestions = allQuestions.filter(
    (q: HistoryQuestions) => q.userAnswer !== q.correctAnswer,
  );

  return (
    <div className="flex flex-col w-full px-6 py-3 mx-auto text-black dark:text-white sm:w-10/12">
      {particlesEnabled && correctPercentage >= summaryQuiz.passingScore && (
        <ReactConfetti recycle={false} numberOfPieces={200} gravity={0.2} />
      )}
      <header className="flex flex-col items-center justify-center w-full mb-14">
        <Image
          src={resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo.svg"}
          alt="IntelliQ"
          width={250}
          height={250}
        />
        <h1 className="text-2xl font-bold sm:text-4xl text-primary">
          {summaryQuiz.quizTitle}
        </h1>
      </header>

      <Card className="w-full p-4 border-b border-white rounded-lg shadow-lg border-opacity-15">
        <CardHeader>
          <div className="flex flex-col items-center justify-between lg:flex-row">
            <div className="flex items-center justify-center gap-4">
              <Award size={40} className="text-primary" />
              <div className="flex flex-col justify-center mb-2 text-5xl">
                <span className="text-xl">Your Score</span>
                <span className="text-4xl font-bold text-primary">
                  {correctPercentage.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-6 mt-4 lg:flex-row lg:mt-0">
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="text-primary" />

                  <span className="text-lg">Total Time</span>
                </div>
                <span className="text-2xl font-semibold text-center text-primary">
                  {formatTime(timeTaken)}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="text-primary" />
                  <span className="text-lg">Correct Answers</span>
                </div>
                <span className="text-2xl font-semibold text-center text-primary">
                  {summaryQuiz.quizScore}/{totalQuestions}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardDescription className="flex flex-col items-center justify-between gap-2 px-6">
          {isMounted && (
            <>
              <Progress
                className="w-full mb-4 outline outline-1 outline-slate-600"
                value={(100 / totalQuestions) * correctAnswersCount}
              />
              <h4 className="text-lg font-semibold text-primary">
                {(100 / totalQuestions) * correctAnswersCount >=
                summaryQuiz.passingScore
                  ? "YOU PASSED!"
                  : "YOU FAILED!"}
              </h4>
            </>
          )}
          <span className="text-lg text-center text-black dark:text-white">
            {descriptionText}
          </span>
        </CardDescription>
      </Card>

      <div className="mt-6">
        <Tabs defaultValue="all">
          <TabsList className="flex justify-around">
            <TabsTrigger className="w-full" value="all">
              All Questions
            </TabsTrigger>
            <TabsTrigger className="w-full" value="correct">
              Correct
            </TabsTrigger>
            <TabsTrigger className="w-full" value="incorrect">
              Incorrect
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ScrollArea className="h-[350px] w-full">
              <QuestionsList questions={allQuestions} />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="correct">
            <ScrollArea className="h-[350px] w-full">
              <QuestionsList questions={correctQuestions} />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="incorrect">
            <ScrollArea className="h-[350px] w-full">
              <QuestionsList questions={incorrectQuestions} />
            </ScrollArea>
          </TabsContent>
          {formValues.topic && (
            <div className="flex justify-center mt-2">
              <Button
                onClick={() => {
                  const quizCreation = {
                    topic: formValues.topic,
                    number: formValues.number,
                    description: formValues.description,
                    tags: formValues.tags,
                    showCorrectAnswers: true,
                    passingScore: formValues.passingScore,
                    questions: formValues.questions,
                    quizLanguage: formValues.quizLanguage,
                    quizType: QuizType.Enum.singleplayer,
                  } as QuizData;
                  fetchQuestions(quizCreation);

                  setReplay(true);
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Replay Quiz
              </Button>
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Summary;
