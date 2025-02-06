'use client';
import { useQuiz } from '@/contexts/quiz-context';
import { redirect, useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/utils/show-toast';
import { useQuizLogic } from '@/contexts/quiz-logic-context';
import { Card, CardDescription } from '@/components/ui/card';
import { Timer, CircleCheck, CircleX, ChevronRight, User, CheckCircle } from 'lucide-react';
import QAndA from '../single-player-quiz/q-and-a';
import Lottie from 'lottie-react';
import Summarizing from '../../../public/intelliq_summarizing.json';
import { Progress } from '@/components/ui/progress';
import { Player, useMultiplayer } from '@/contexts/multiplayer-context';
import { createClient } from '@/lib/supabase/supabase-client-side';
import { createApiClient } from '@/utils/api-client';
import { useAuth } from '@/contexts/user-context';
import { PresenceData } from '@/contexts/multiplayer-context';
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
    isMultiplayer,
    setIsMultiplayer,
  } = useQuizLogic();
  const { players, setPlayers, isCreator, setIsCreator, channel, setChannel, timeLimit } =
    useMultiplayer();

  const { currentUser } = useAuth();
  const routerParams = useParams();
  const router = useRouter();
  const roomCode = routerParams['game-id'] as string;
  const [timer, setTimer] = useState(timeLimit);
  const [quizFinished, setQuizFinished] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  const startTimer = () => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
  };

  useEffect(() => {
    if (!quizFinished) {
      setTimer(timeLimit); // Reset timer for the new question
      startTimer(); // Start the timer for the new question
      dispatch({ type: 'RESET_SELECTED_ANSWER' });
    }

    // Cleanup function to clear the interval when the component unmounts or the question changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [questionNumber, quizFinished]); // Only restart the timer when questionNumber or quizFinished changes

  if (!currentQuiz) {
    redirect('/');
  }

  useEffect(() => {
    if (quizFinished) {
      setTimeout(() => {
        // submitQuiz(userAnswer, totalTimeInSeconds);
        alert('finished');
        // router.push(`/multiplayer/${roomCode}`);
      }, 3000);
    }
  }, [quizFinished]);

  useEffect(() => {
    if (channel && isCreator) {
      setShowCorrectAnswer(false);
      channel.send({
        type: 'broadcast',
        event: 'next-question',
        payload: { questionNumber },
      });
    }
    setProgressValue((questionNumber / currentQuiz.quiz.length) * 100);
  }, [questionNumber]);

  const validateAnswer = async () => {
    if (!showCorrectAnswer && (selectedAnswer || selectedAnswer === null)) {
      dispatch({
        type: 'VALIDATE_ANSWER',
        payload: {
          question: currentQuiz.quiz[questionNumber].text,
          correctAnswer: currentQuiz.quiz[questionNumber].correctAnswer.slice(3),
          userAnswer: selectedAnswer,
        },
      });
    }
  };

  useEffect(() => {
    const roomChannel = supabase.channel(roomCode);
    setChannel(roomChannel);

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = roomChannel.presenceState();

        const playersList = Object.values(newState)
          .flat()
          .map((player) => {
            const data = player as any;
            return {
              id: data.presenceData.currentUser.id,
              email: data.presenceData.currentUser.email,
              userName: data.presenceData.currentUser.name,
              score: data.presenceData.currentUser.score,
              selectedAnswer: data.presenceData.currentUser.selectedAnswer,
              isCreator: data.presenceData.currentUser.isCreator,
            } as Player;
          });

        // First player in the list is the leader

        console.log('players', playersList);

        setPlayers(playersList as Player[]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && currentUser) {
          const presenceData = {
            currentUser: {
              id: currentUser.id,
              email: currentUser.email,
              name: currentUser.name,
              score: correctAnswer,
              selectedAnswer,
              isCreator,
            },
          };

          await roomChannel.track({ presenceData });
        }
      });

    // Consolidated event listeners for score updates, next question, and quiz completion
    roomChannel
      .on('broadcast', { event: 'next-question' }, async ({ payload }) => {
        // Broadcast the timer expiration event
        if (payload.questionNumber >= currentQuiz.quiz.length) {
          setQuizFinished(true);
        }
        setQuestionNumber(payload.questionNumber);
        // dispatch({ type: 'RESET_SELECTED_ANSWER' });
        setShowCorrectAnswer(false);

        setProgressValue((payload.questionNumber / currentQuiz.quiz.length) * 100);
      })
      .on('broadcast', { event: 'quiz_completed' }, () => {});

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [supabase, roomCode, router, currentUser, selectedAnswer, correctAnswer, questionNumber]);

  useEffect(() => {
    setIsMultiplayer(true);
  }, []);

  useEffect(() => {
    if (timer === 0) {
      setShowCorrectAnswer(true);
      if (selectedAnswer === null) {
        validateAnswer();
      }
    }
  }, [timer, validateAnswer]);

  if (quizFinished) {
    return (
      <div className='absolute left-1/2 top-1/2 flex w-[40] -translate-x-1/2 -translate-y-1/2 flex-col items-center md:w-[30vw]'>
        <h1 className='mt-2 text-xl'>Summarizing</h1>
        <Lottie animationData={Summarizing} />
      </div>
    );
  }

  return (
    <div className='mx-auto flex w-[400] flex-col items-center justify-center p-4 dark:text-white sm:w-[800px] '>
      <header className='mb-4 text-center text-2xl font-bold sm:text-4xl'>
        {currentQuiz.quiz[questionNumber].questionTitle}
      </header>
      <section className='w-full rounded-lg p-6 text-center shadow-none'>
        <div className='mb-4 flex items-center justify-between'>
          <Button className='inline-flex items-center rounded p-2 pr-3 text-sm font-medium text-black sm:text-xl'>
            <Timer className='mr-2 text-base sm:text-2xl' />{' '}
            <span id='time'>Time left: {timer} seconds</span>
          </Button>
          {showCorrectAnswer && (
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
          )}
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
          userAnswer={selectedAnswer}
          correctAnswer={currentQuiz.quiz[questionNumber].correctAnswer.slice(3)}
        />
        {showCorrectAnswer && isCreator && (
          <Button
            disabled={quizFinished}
            onClick={() => {
              const newQuestionNumber = questionNumber + 1;

              // Broadcast the "next-question" event to all players
              if (channel && isCreator) {
                channel.send({
                  type: 'broadcast',
                  event: 'next-question',
                  payload: {
                    questionNumber: newQuestionNumber,
                  },
                });
              }

              // Update local state for the creator

              setQuestionNumber(newQuestionNumber);

              // Check if the quiz should finish
              if (newQuestionNumber >= currentQuiz.quiz.length) {
                setQuizFinished(true);
              }
            }}
          >
            Next <ChevronRight />
          </Button>
        )}
      </section>
    </div>
  );
};

export default Quiz;
