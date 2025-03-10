'use client';
import { useQuiz } from '@/contexts/quiz-context';
import { redirect } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/utils/show-toast';
import { useQuizLogic } from '@/contexts/quiz-logic-context';
import { Card, CardDescription } from '@/components/ui/card';
import { Timer, CircleCheck, CircleX, ChevronRight } from 'lucide-react';
import QAndA from './q-and-a';
import Lottie from 'lottie-react';
import Summarizing from '../../../public/IntelliQ summarizing.json';
import { Progress } from '@/components/ui/progress';
import NumberFlow, { NumberFlowGroup } from '@number-flow/react';
import { motion } from 'framer-motion';
import { useQuizCreation } from '@/contexts/quiz-creation-context';

const Quiz = () => {
  const { currentQuiz, submitSinglePlayerQuiz, summaryQuiz, dispatch: dispatchQuiz } = useQuiz();

  const {
    questionNumber,
    setQuestionNumber,
    selectedAnswer,
    dispatch,
    correctAnswer,
    wrongAnswer,
    userAnswer,
    setProgressValue,
    progressValue,
    setShowCorrectAnswer,
    showCorrectAnswer,
  } = useQuizLogic();
  const { formValues } = useQuizCreation();
  const [time, setTime] = useState({ minutes: 0, seconds: 0 });
  const [quizFinished, setQuizFinished] = useState(false);
  const [totalTimeInSeconds, setTotalTimeInSeconds] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!quizFinished) {
      timer = setInterval(() => {
        setTime((prevTime) => {
          const seconds = prevTime.seconds + 1;
          const newMinutes = Math.floor(prevTime.minutes + seconds / 60);
          const newSeconds = seconds % 60;
          return {
            minutes: newMinutes,
            seconds: newSeconds,
          };
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [quizFinished]);
  if (!currentQuiz) {
    redirect('/');
  }
  if (summaryQuiz) {
    setQuizFinished(false);
    setShowCorrectAnswer(false);
    setTime({ minutes: 0, seconds: 0 });
    dispatch({ type: 'RESET_GAME_LOGIC' });
    setQuestionNumber(0);
    redirect(`/single-player/summary/${summaryQuiz.quizId}`);
  }

  useEffect(() => {
    if (quizFinished) {
      setTimeout(() => {
        submitSinglePlayerQuiz(
          userAnswer,
          totalTimeInSeconds,
          currentQuiz,
          correctAnswer,
          formValues.description!,
          formValues.quizLanguage,
          formValues.topic,
          formValues.passingScore,
          formValues.tags,
        );
      }, 1000);
    }
  }, [quizFinished]);

  useEffect(() => {
    setProgressValue(((questionNumber + 1) / currentQuiz.quiz.length) * 100);
  }, [questionNumber]);

  if (quizFinished) {
    return (
      <div className='absolute left-1/2 top-1/2 flex w-[40] -translate-x-1/2 -translate-y-1/2 flex-col items-center md:w-[30vw]'>
        <h1 className='mt-2 text-xl'>Summarizing</h1>
        <Lottie animationData={Summarizing} />
      </div>
    );
  }

  return (
    <div className='mx-auto flex w-[400] flex-col items-center justify-center p-4 text-white sm:w-[800px] '>
      <header className='mb-4 text-center text-2xl font-bold sm:text-4xl'>
        {currentQuiz.quiz[questionNumber].questionTitle}
      </header>
      <section className='w-full rounded-lg p-6 text-center shadow-none'>
        <div className='mb-4 flex items-center justify-between'>
          <motion.div
            layout
            className='inline-flex items-center rounded p-2 pr-3 text-sm font-medium text-black sm:text-xl bg-primary'
            animate={{
              width: time.minutes > 0 ? '7.75rem' : '5.5rem',
            }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut',
            }}
          >
            <Timer className='mr-2 text-base sm:text-2xl' />
            <span id='time' className='flex items-center gap-2'>
              <NumberFlowGroup>
                {time.minutes > 0 && (
                  <NumberFlow
                    value={time.minutes}
                    suffix='m'
                    transformTiming={{
                      duration: 500,
                      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    opacityTiming={{ duration: 400, easing: 'ease-out' }}
                  />
                )}
                <NumberFlow
                  value={time.seconds}
                  suffix='s'
                  transformTiming={{
                    duration: 500,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </NumberFlowGroup>
            </span>
          </motion.div>
          <Card className='flex items-center rounded-lg border-b-[0.5px] border-white border-opacity-20 text-2xl font-bold text-green-500'>
            <div className='mx-2 flex items-center'>
              <CircleCheck className='text-2xl sm:text-3xl ' />
              <NumberFlow value={correctAnswer} className='ml-1 text-2xl sm:text-3xl' />
            </div>
            <div className='mx-2 flex items-center text-red-500'>
              <NumberFlow value={wrongAnswer} className='mr-1 text-2xl sm:text-3xl' />
              <CircleX className='text-2xl sm:text-3xl' />
            </div>
          </Card>
        </div>
        <CardDescription className='my-3 flex items-start text-sm sm:text-base'>
          <NumberFlow value={questionNumber + 1} suffix=' out of ' />
          {currentQuiz.quiz.length}
        </CardDescription>
        <Progress
          value={progressValue}
          className='w-full mb-4 outline outline-1 outline-slate-600'
        />

        <QAndA
          quiz={currentQuiz.quiz}
          questionNumber={questionNumber}
          userAnswer={selectedAnswer}
          correctAnswer={currentQuiz.quiz[questionNumber].correctAnswer}
          onAnswerSelected={() => {
            dispatch({ type: 'SET_SELECTED_ANSWER', payload: selectedAnswer });
          }}
        />

        <Button
          disabled={quizFinished}
          onClick={() => {
            const checkQuizFinished = () => {
              if (questionNumber >= currentQuiz.quiz.length - 1) {
                setQuizFinished(true);
                setTotalTimeInSeconds(time.minutes * 60 + time.seconds);
              }
            };
            if (currentQuiz.showCorrectAnswers) {
              if (selectedAnswer && !showCorrectAnswer) {
                dispatch({
                  type: 'VALIDATE_ANSWER',
                  payload: {
                    question: currentQuiz.quiz[questionNumber].text,
                    correctAnswer: currentQuiz.quiz[questionNumber].correctAnswer,
                    userAnswer: selectedAnswer,
                  },
                });
                setShowCorrectAnswer(true);
              }
              if (selectedAnswer && showCorrectAnswer) {
                setQuestionNumber((prevQuestionNumber) => {
                  return prevQuestionNumber >= currentQuiz.quiz.length - 1
                    ? prevQuestionNumber
                    : prevQuestionNumber + 1;
                });
                setShowCorrectAnswer(false);
                dispatch({ type: 'RESET_SELECTED_ANSWER' });
                checkQuizFinished();
              }
            } else if (selectedAnswer && !currentQuiz.showCorrectAnswers) {
              dispatch({
                type: 'VALIDATE_ANSWER',
                payload: {
                  question: currentQuiz.quiz[questionNumber].text,
                  correctAnswer: currentQuiz.quiz[questionNumber].correctAnswer,
                  userAnswer: selectedAnswer,
                },
              });

              setQuestionNumber((prevQuestionNumber) => {
                return prevQuestionNumber >= currentQuiz.quiz.length - 1
                  ? prevQuestionNumber
                  : prevQuestionNumber + 1;
              });
              dispatch({ type: 'RESET_SELECTED_ANSWER' });
              checkQuizFinished();
            }
            if (!selectedAnswer && !showCorrectAnswer) {
              showToast('destructive', 'WARNING!', 'Please choose an answer before proceeding');
            }
          }}
          className='w-full/50 mt-4 rounded-lg px-6 py-2 text-center text-base font-bold hover:bg-primary/90 active:bg-primary/80'
        >
          Next <ChevronRight />
        </Button>
      </section>
    </div>
  );
};

export default Quiz;
