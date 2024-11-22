'use client';
import { useEffect } from 'react';
import { useQuiz } from '@/contexts/quiz-context';
import { createClient } from '@/lib/supabase/supabase-client-side';
import { redirect } from 'next/navigation';
import React, { useState } from 'react';
import { Card, CardHeader, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTime } from '@/lib/format-time';
import QuestionsList from './summary-questions'; // Assuming this component displays questions list
import Image from 'next/image';
import { Award, Clock } from 'lucide-react';
import { Progress } from '../ui/progress';

const Summary = () => {
  const { dispatch, summaryQuiz } = useQuiz();
  const [isMounted, setIsMounted] = useState(false); // State to track if component has mounted

  useEffect(() => {
    setIsMounted(true);
    dispatch({ type: 'RESET_QUIZ' });
  }, []);

  if (!summaryQuiz) {
    redirect('/');
  }

  const correctAnswersCount = summaryQuiz.rawQuestions.correctAnswersCount;
  const totalQuestions = summaryQuiz.rawQuestions.questions.length;
  const correctPercentage = (correctAnswersCount / totalQuestions) * 100;
  const timeTaken = summaryQuiz.rawQuestions.timeTaken;

  // This will be modified once i work with the new database
  let descriptionText = '';
  if (correctPercentage >= 70) {
    descriptionText =
      '👏 Excellent work! Your understanding of the topic is impressive. Keep it up! 👏';
  } else if (correctPercentage > 50) {
    descriptionText = '👍 Great job! Keep up the good work. 👍';
  } else {
    descriptionText = '😊 Nice try! Keep practicing to improve your score. 😊';
  }

  // Filter questions
  const allQuestions = summaryQuiz.rawQuestions.questions;
  const correctQuestions = allQuestions.filter((q) => q.userAnswer === q.correctAnswer);
  const incorrectQuestions = allQuestions.filter((q) => q.userAnswer !== q.correctAnswer);

  return (
    <div className='mx-auto flex w-full flex-col px-6 py-3 text-white sm:w-10/12'>
      <header className='mb-14 flex w-full flex-col items-center justify-center'>
        <Image src='/logo-dark.svg' alt='IntelliQ' width={250} height={250} />
        <h1 className='text-2xl font-bold sm:text-4xl text-primary'>
          {summaryQuiz.rawQuestions.quiz_title}
        </h1>
      </header>

      <Card className='w-full border-b-[0.5px] border-white border-opacity-[.15] p-4'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center justify-center gap-2'>
              <Award size={35} className='text-primary' />
              <div className='flex flex-col justify-center text-5xl mb-2'>
                <span className='text-xl'>Your Score</span>
                <span className='text-primary text-4xl font-bold'>{correctPercentage.toFixed(2)}%</span>
              </div>
            </div>
            <div className='flex items-center justify-center gap-6'>
              <div className='flex items-center justify-center gap-2'>
                <Clock className='text-primary' />
                <div className='flex flex-col justify-center'>
                  <span className='text-lg'>Total Time</span>
                  <span className='text-primary text-2xl font-semibold'>
                    {formatTime(timeTaken)}
                  </span>
                </div>
              </div>
              <div className='flex items-center justify-center gap-2'>
                <Clock className='text-primary' />
                <div className='flex flex-col justify-center'>
                  <span className='text-lg'>Correct Answers</span>
                  <span className='text-primary text-2xl font-semibold'>
                    {correctAnswersCount}/{totalQuestions}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardDescription className='flex flex-col justify-between items-center px-6 gap-2'>
          {isMounted && (
            <>
              <Progress
                className='w-full mb-4 outline outline-1 outline-slate-600'
                value={(100 / totalQuestions) * correctAnswersCount}
              />
              <h4 className='text-lg text-primary font-semibold'>
                {(100 / totalQuestions) * correctAnswersCount > 70 ? 'YOU PASSED!' : 'YOU FAILED!'}
              </h4>
            </>
          )}
          <span className='text-lg text-white'>{descriptionText}</span>
        </CardDescription>
      </Card>

      <div className='mt-6'>
        <Tabs defaultValue='all'>
          <TabsList className='flex justify-around'>
            <TabsTrigger className='w-full' value='all'>
              All Questions
            </TabsTrigger>
            <TabsTrigger className='w-full' value='correct'>
              Correct
            </TabsTrigger>
            <TabsTrigger className='w-full' value='incorrect'>
              Incorrect
            </TabsTrigger>
          </TabsList>

          <TabsContent value='all'>
            <ScrollArea className='h-[350px] w-full'>
              <QuestionsList questions={allQuestions} />
            </ScrollArea>
          </TabsContent>
          <TabsContent value='correct'>
            <ScrollArea className='h-[350px] w-full'>
              <QuestionsList questions={correctQuestions} />
            </ScrollArea>
          </TabsContent>
          <TabsContent value='incorrect'>
            <ScrollArea className='h-[350px] w-full'>
              <QuestionsList questions={incorrectQuestions} />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Summary;
