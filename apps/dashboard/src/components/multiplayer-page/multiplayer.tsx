'use client';
import { useQuiz } from '@/contexts/quiz-context';
import { redirect, useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/utils/show-toast';
import { useQuizLogic } from '@/contexts/quiz-logic-context';
import { Card, CardDescription } from '@/components/ui/card';
import {
  Timer,
  CircleCheck,
  CircleX,
  ChevronRight,
  User as Player,
  CheckCircle,
} from 'lucide-react';
import QAndA from '../single-player-quiz/q-and-a';
import Lottie from 'lottie-react';
import Summarizing from '../../../public/IntelliQ summarizing.json';
import { Progress } from '@/components/ui/progress';

const Quiz = () => {
  const { currentQuiz, submitQuiz, summaryQuiz, dispatch: dispatchQuiz } = useQuiz();

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
  const routerParams = useParams();
  const router = useRouter();
  const roomCode = routerParams['game-id'] as string;
  const [timer, setTimer] = useState(10); // 10 seconds timer
  const [quizFinished, setQuizFinished] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const startTimer = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }

    const id = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setShowCorrectAnswer(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setIntervalId(id);
  };
  useEffect(() => {
    if (!quizFinished) {
      setTimer(10); // Reset timer for the new question
      startTimer(); // Start the timer for the new question
    }
    return () => clearInterval(intervalId!);
  }, [quizFinished, questionNumber]);
  if (!currentQuiz) {
    redirect('/');
  }
  // if (summaryQuiz) {
  //   setQuizFinished(false);
  //   setShowCorrectAnswer(false);
  //   dispatch({ type: 'RESET_GAME_LOGIC' });
  //   setQuestionNumber(0);
  //   redirect(`/single-player/summary/${summaryQuiz.quiz_id}`);
  // }

  useEffect(() => {
    if (quizFinished) {
      setTimeout(() => {
        // submitQuiz(userAnswer, totalTimeInSeconds);
        alert('finsihed');
      }, 3000);
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
          <Button className='inline-flex items-center rounded p-2 pr-3 text-sm font-medium text-black sm:text-xl'>
            <Timer className='mr-2 text-base sm:text-2xl' />{' '}
            <span id='time'>Time left: {timer} seconds</span>
          </Button>
          <Card className='flex items-center rounded-lg border-b-[0.5px] border-white border-opacity-20 text-2xl font-bold text-green-500'>
            <div className='mx-2 flex items-center'>
              <CircleCheck className='text-2xl sm:text-3xl ' />
              <span className='mb-1 ml-1 text-2xl sm:text-3xl'>{correctAnswer}</span>
            </div>
            <div className='mx-2 flex items-center text-red-500'>
              <span className='mb-1 mr-1 text-2xl sm:text-3xl'>{wrongAnswer}</span>
              <CircleX className='text-2xl sm:text-3xl' />
            </div>
          </Card>
        </div>
        <CardDescription className='my-3 flex items-start text-sm sm:text-base'>
          <span>{questionNumber + 1}</span>&nbsp;out of {currentQuiz.quiz.length} Questions
        </CardDescription>
        <Progress
          value={progressValue}
          className='w-full mb-4 outline outline-1 outline-slate-600'
        />

        <QAndA
          quiz={currentQuiz.quiz}
          questionNumber={questionNumber}
          showCorrectAnswers={currentQuiz?.showCorrectAnswers || undefined}
          userAnswer={selectedAnswer}
          correctAnswer={currentQuiz.quiz[questionNumber].correctAnswer.slice(3)}
        />

        <Button
          disabled={quizFinished}
          onClick={() => {
            const checkQuizFinished = () => {
              if (questionNumber >= currentQuiz.quiz.length - 1) {
                setQuizFinished(true);
              }
            };
            if (currentQuiz.showCorrectAnswers) {
              if (selectedAnswer && !showCorrectAnswer) {
                dispatch({
                  type: 'VALIDATE_ANSWER',
                  payload: {
                    question: currentQuiz.quiz[questionNumber].text,
                    correctAnswer: currentQuiz.quiz[questionNumber].correctAnswer.slice(3),
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
                  correctAnswer: currentQuiz.quiz[questionNumber].correctAnswer.slice(3),
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
