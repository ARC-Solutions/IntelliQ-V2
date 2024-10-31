'use client';
import { useQuiz } from '@/contexts/quiz-context';
import { createClient } from '@/lib/supabase/supabase-client-side';
import { redirect } from 'next/navigation';
import React, { useEffect } from 'react';
import { Card, CardHeader, CardDescription } from '@/components/ui/card';
import { formatTime } from '@/lib/format-time';
const Summary = () => {
  const { dispatch, summaryQuiz } = useQuiz();

  if (!summaryQuiz) {
    redirect('/');
  }
  const correctAnswersCount = summaryQuiz.rawQuestions.correctAnswersCount;
  const totalQuestions = summaryQuiz.rawQuestions.questions.length;
  const correctPercentage = (correctAnswersCount / totalQuestions) * 100;
  const timeTaken = summaryQuiz.rawQuestions.timeTaken;
  useEffect(() => {
    dispatch({ type: 'RESET_QUIZ' });
  }, []);
  let descriptionText = '';

  if (correctPercentage >= 70) {
    descriptionText =
      '👏 Excellent work! Your understanding of the topic is impressive. Keep it up! 👏';
  } else if (correctPercentage > 50) {
    descriptionText = '👍 Great job! Keep up the good work. 👍';
  } else {
    descriptionText = '😊 Nice try! Keep practicing to improve your score. 😊';
  }

  // Messages based on time taken
  let timeMessage = '';

  if (timeTaken < 60) {
    timeMessage = '⏱️ Wow, you finished so quickly! Impressive speed! ⚡';
  } else if (timeTaken < 180) {
    timeMessage = '⏱️ Good job! You completed the quiz at a steady pace. 🚀';
  } else {

    timeMessage =
      "⏱️ Well done! You're as thoughtful as a wise tortoise in approaching each question. 🐢";
  }
  return (
    <div className='mx-auto flex w-full flex-col items-center justify-center px-6 py-4 text-white sm:w-10/12'>
      <header className='mb-14 flex w-full flex-row items-center justify-between'>
        <h1 className='text-4xl font-bold sm:text-5xl'>{summaryQuiz.rawQuestions.quiz_title}</h1>
      </header>

      {/* Metrics */}
      <div className=' flex w-full flex-wrap justify-between gap-4'>
        {/* Score section */}
        <Card
          id='score'
          className='w-full flex-nowrap border-b-[0.5px] border-white border-opacity-[.15] p-4 pb-0 pt-0 md:w-5/12'
        >
          <CardHeader className='flex flex-row items-center'>
            {/* <BsFillMortarboardFill className='mr-3 text-5xl' /> */}
            &nbsp;
            <span className='text-3xl'>Score:&nbsp; </span>
            <span className='text-3xl text-primary'>
              {summaryQuiz.rawQuestions.correctAnswersCount}
            </span>
          </CardHeader>
          <CardDescription className='p-6 text-xl'>{descriptionText}</CardDescription>
        </Card>

        {/* time section */}
        <Card
          id='time'
          className='w-full flex-nowrap border-b-[0.5px] border-white border-opacity-[.15] p-4 pb-1 pt-0 md:w-5/12'
        >
          <CardHeader className='flex flex-row items-center'>
            <span className='text-3xl text-primary'>{formatTime(timeTaken)}</span>
            &nbsp;
            {/* <BiSolidTimer className='text-5xl' /> */}
          </CardHeader>
          <CardDescription className='p-4 text-xl'>{timeMessage}</CardDescription>
        </Card>
      </div>
    </div>
  );
};

export default Summary;
