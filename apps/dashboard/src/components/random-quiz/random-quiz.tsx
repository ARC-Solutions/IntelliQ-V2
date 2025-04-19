'use client';
import {  useEffect } from 'react';
import Lottie from 'lottie-react';
import Loading from '@/assets/loading.json';
import LoadingDark from '@/assets/loading-dark.json';
import { useTheme } from 'next-themes';
import { useQuizCreation } from '@/contexts/quiz-creation-context';
import { useQuiz } from '@/contexts/quiz-context';
import { redirect } from 'next/navigation';

export function RandomQuiz() {
  const {
    formValues,
    onSubmit,
    addTag,
    setTopicValue,
    setDescriptionValue,
    setNumberValue,
    setQuizLanguageValue,
  } = useQuizCreation();
  const { isLoading, fetchingFinished, currentQuiz } = useQuiz();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // timeout to ensure context is ready
    const timer = setTimeout(() => {
      const randomQuestionCount = Math.floor(Math.random() * 10) + 1;
      setTopicValue("random");
      setDescriptionValue("choose a topic yourself");
      setNumberValue(randomQuestionCount);
      setQuizLanguageValue("en");
      if (!formValues.tags?.includes("random")) {
        addTag("random");
      }
      
      setTimeout(() => {
        onSubmit();
      }, 100);
    }, 100);

    return () => clearTimeout(timer);
  }, []); // Empty dependency array = run once on mount

  if (fetchingFinished && currentQuiz) {
    redirect('/single-player/quiz/play');
  }
  if (isLoading) {
    return (
      <div className="absolute left-1/2 top-1/2 flex w-[40] -translate-x-1/2 -translate-y-1/2 flex-col items-center md:w-[30vw]">
        <Lottie animationData={resolvedTheme === "dark" ? LoadingDark : Loading} />
      </div>
    );
  }

  return (
    <div className="absolute left-1/2 top-1/2 flex w-[40] -translate-x-1/2 -translate-y-1/2 flex-col items-center md:w-[30vw]">
        <Lottie animationData={resolvedTheme === "dark" ? LoadingDark : Loading} />
      </div>
  );
}
