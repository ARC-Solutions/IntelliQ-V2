"use client";
import { Button } from "@/components/ui/button";
import { Card, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Player, useMultiplayer } from "@/contexts/multiplayer-context";
import { useQuiz } from "@/contexts/quiz-context";
import { useQuizLogic } from "@/contexts/quiz-logic-context";
import { useAuth } from "@/contexts/user-context";
import { createClient } from "@/lib/supabase/supabase-client-side";
import Lottie from "lottie-react";
import { ChevronRight, CircleCheck, CircleX, Timer } from "lucide-react";
import { redirect, useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import Summarizing from "../../../public/IntelliQ summarizing.json";
import QAndA from "../single-player-quiz/q-and-a";
import { createApiClient } from "@/utils/api-client";
import { Skeleton } from "@/components/ui/skeleton";

const Quiz = () => {
  const {
    currentQuiz,
    submitQuiz,
    summaryQuiz,
    dispatch: dispatchQuiz,
  } = useQuiz();
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
  const {
    players,
    setPlayers,
    isCreator,
    setIsCreator,
    channel,
    setChannel,
    timeLimit,
  } = useMultiplayer();

  const { currentUser } = useAuth();
  const routerParams = useParams();
  const router = useRouter();
  const roomCode = routerParams["roomCode"] as string;
  const [timer, setTimer] = useState(timeLimit);
  const [quizFinished, setQuizFinished] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentCorrectAnswer, setCurrentCorrectAnswer] = useState<string>();
  const [answerSelectedTime, setAnswerSelectedTime] = useState<number | null>(
    null
  );
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now()
  );
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [wrongAnswersCount, setWrongAnswersCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      dispatch({ type: "RESET_SELECTED_ANSWER" });
      setAnswerSelectedTime(null);
      setQuestionStartTime(Date.now());
    }

    // Cleanup function to clear the interval when the component unmounts or the question changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [questionNumber, quizFinished]); // Only restart the timer when questionNumber or quizFinished changes

  if (!currentQuiz) {
    redirect("/");
  }

  useEffect(() => {
    if (quizFinished) {
      setTimeout(() => {
        // submitQuiz(userAnswer, totalTimeInSeconds);
        alert("finished");
        // router.push(`/multiplayer/${roomCode}`);
      }, 3000);
    }
  }, [quizFinished]);

  useEffect(() => {
    if (channel && isCreator) {
      setShowCorrectAnswer(false);
      channel.send({
        type: "broadcast",
        event: "next-question",
        payload: { questionNumber },
      });
    }
    setProgressValue((questionNumber / currentQuiz.quiz.length) * 100);
  }, [questionNumber]);

  const submitAnswerToBackend = async (answer: string | null) => {
    if (!currentQuiz || !currentQuiz.quiz[questionNumber].id) return;

    try {
      setIsSubmitting(true);
      // Calculate actual time taken based on when the answer was selected
      let questionTimeTaken: number;

      if (answerSelectedTime) {
        // If an answer was selected, use the actual selection time
        questionTimeTaken = answerSelectedTime - questionStartTime;
      } else {
        // If no answer was selected (timer ran out), use the full time
        questionTimeTaken = timeLimit * 1000;
      }

      // Ensure time taken doesn't exceed the maximum allowed
      questionTimeTaken = Math.min(questionTimeTaken, timeLimit * 1000);

      console.log("Submitting answer:", {
        roomCode: roomCode,
        questionId: currentQuiz.quiz[questionNumber].id,
        userAnswer: answer || "",
        timeTaken: questionTimeTaken,
      });

      const client = createApiClient();
      const response = await client.api.v1["quiz-submissions"].multiplayer[
        ":roomCode"
      ].submissions.$post({
        param: { roomCode: roomCode },
        json: {
          questionId: currentQuiz.quiz[questionNumber].id,
          userAnswer: answer || "",
          timeTaken: questionTimeTaken,
        },
      });

      const data = await response.json();
      console.log("Submission response:", data);

      if (data.success) {
        setCurrentCorrectAnswer(data.correctAnswer);
        setShowCorrectAnswer(true);

        // Store the correct answers count
        setCorrectAnswersCount(data.submission.correctAnswersCount);

        // Calculate wrong answers based on the current question number + 1
        // This ensures we only count questions that have been answered
        const answeredQuestionsCount = questionNumber + 1;
        setWrongAnswersCount(
          answeredQuestionsCount - data.submission.correctAnswersCount
        );

        setTotalQuestions(data.totalQuestions);
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (timer === 0) {
      setShowCorrectAnswer(true);
      if (selectedAnswer) {
        submitAnswerToBackend(selectedAnswer);
      } else {
        // Handle case when no answer is selected
        submitAnswerToBackend(null);
      }
    }
  }, [timer]);

  useEffect(() => {
    const roomChannel = supabase.channel(roomCode);
    setChannel(roomChannel);

    roomChannel
      .on("presence", { event: "sync" }, () => {
        const newState = roomChannel.presenceState();
        console.log("newState", newState);
        const playersList = Object.values(newState)
          .flat()
          .map((player) => {
            const data = player as any;
            console.log("Player data:", data);

            if (!data.presenceData || !data.presenceData.currentUser) {
              console.warn("Missing expected player data structure", data);
              return {
                id: data.id || "unknown",
                email: "",
                userName: data.user_name || "Unknown Player",
                score: 0,
                selectedAnswer: null,
                isCreator: false,
              } as Player;
            }

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
        console.log("players", playersList);

        setPlayers(playersList as Player[]);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && currentUser) {
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
      .on("broadcast", { event: "next-question" }, async ({ payload }) => {
        // Broadcast the timer expiration event
        if (payload.questionNumber >= currentQuiz.quiz.length) {
          setQuizFinished(true);
        }
        setQuestionNumber(payload.questionNumber);
        // dispatch({ type: 'RESET_SELECTED_ANSWER' });
        setShowCorrectAnswer(false);

        setProgressValue(
          (payload.questionNumber / currentQuiz.quiz.length) * 100
        );
      })
      .on("broadcast", { event: "quiz_completed" }, () => {});

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [
    supabase,
    roomCode,
    router,
    currentUser,
    selectedAnswer,
    correctAnswer,
    questionNumber,
  ]);

  useEffect(() => {
    setIsMultiplayer(true);
  }, []);

  const handleAnswerSelected = (answer: string) => {
    if (!answerSelectedTime) {
      setAnswerSelectedTime(Date.now());
    }
    dispatch({ type: "SET_SELECTED_ANSWER", payload: answer });
  };

  if (quizFinished) {
    return (
      <div className="absolute left-1/2 top-1/2 flex w-[40] -translate-x-1/2 -translate-y-1/2 flex-col items-center md:w-[30vw]">
        <h1 className="mt-2 text-xl">Summarizing</h1>
        <Lottie animationData={Summarizing} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-[400] flex-col items-center justify-center p-4 text-white sm:w-[800px] ">
      <header className="mb-4 text-center text-2xl font-bold sm:text-4xl">
        {currentQuiz.quiz[questionNumber].questionTitle}
      </header>
      <section className="w-full rounded-lg p-6 text-center shadow-none">
        <div className="mb-4 flex items-center justify-between">
          <Button className="inline-flex items-center rounded p-2 pr-3 text-sm font-medium text-black sm:text-xl">
            <Timer className="mr-2 text-base sm:text-2xl" />{" "}
            <span id="time">Time left: {timer} seconds</span>
          </Button>
          {showCorrectAnswer && (
            <Card className="flex items-center rounded-lg border-b-[0.5px] border-white border-opacity-20 text-2xl font-bold">
              {isSubmitting ? (
                <>
                  <div className="mx-2 flex items-center">
                    <CircleCheck className="text-2xl text-gray-300 sm:text-3xl" />
                    <Skeleton className="ml-1 h-8 w-8" />
                  </div>
                  <div className="mx-2 flex items-center">
                    <Skeleton className="mr-1 h-8 w-8" />
                    <CircleX className="text-2xl text-gray-300 sm:text-3xl" />
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-2 flex items-center text-green-500">
                    <CircleCheck className="text-2xl sm:text-3xl" />
                    <span className="ml-1 text-2xl sm:text-3xl">
                      {correctAnswersCount}
                    </span>
                  </div>
                  <div className="mx-2 flex items-center text-red-500">
                    <span className="mr-1 text-2xl sm:text-3xl">
                      {wrongAnswersCount}
                    </span>
                    <CircleX className="text-2xl sm:text-3xl" />
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
        <CardDescription className="my-3 flex items-start text-sm sm:text-base">
          <span>{questionNumber + 1}</span>&nbsp;out of{" "}
          {currentQuiz.quiz.length} Questions
        </CardDescription>
        <Progress
          value={progressValue}
          className="w-full mb-4 outline outline-1 outline-slate-600"
        />

        {isSubmitting ? (
          <QAndASkeleton />
        ) : (
          <QAndA
            quiz={currentQuiz.quiz}
            questionNumber={questionNumber}
            userAnswer={selectedAnswer}
            correctAnswer={currentCorrectAnswer}
            onAnswerSelected={handleAnswerSelected}
          />
        )}
        {showCorrectAnswer && isCreator && (
          <Button
            disabled={quizFinished}
            onClick={() => {
              const newQuestionNumber = questionNumber + 1;

              // Broadcast the "next-question" event to all players
              if (channel && isCreator) {
                channel.send({
                  type: "broadcast",
                  event: "next-question",
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

function QAndASkeleton() {
  return (
    <section>
      {/* Question Title Skeleton */}
      <h1 className="w-full items-center rounded-md bg-primary p-6 text-center">
        <Skeleton className="mx-auto h-8 w-3/4" />
      </h1>

      <div className="mt-4 w-auto">
        {/* Your Answer skeleton */}
        <div className="my-3 w-full">
          <Skeleton className="flex h-[56px] w-full items-center justify-start rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-[100px]" /> {/* "Your Answer:" text */}
              <Skeleton className="h-4 w-[120px]" /> {/* Answer content */}
            </div>
          </Skeleton>
        </div>

        {/* Correct Answer skeleton */}
        <div className="my-3 w-full">
          <Skeleton className="flex h-[56px] w-full items-center justify-start rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-[120px]" />{" "}
              {/* "Correct Answer:" text */}
              <Skeleton className="h-4 w-[120px]" /> {/* Answer content */}
            </div>
          </Skeleton>
        </div>
      </div>
    </section>
  );
}

export default Quiz;
