"use client";

import { useQuizLogic } from "@/contexts/quiz-logic-context";
import { Button } from "@/components/ui/button";
import { useQuiz } from "@/contexts/quiz-context";

type Props = {
  answer: string;
  letter: string;
  onAnswerSelected?: (answer: string) => void;
};

const Answer = ({ answer, letter, onAnswerSelected }: Props) => {
  const { dispatch, selectedAnswer, questionNumber, isMultiplayer } =
    useQuizLogic();
  const { currentQuiz } = useQuiz();

  // Reconstruct the full answer with prefix for backend submission
  const fullAnswer = `${letter}${answer}`;

  return (
    <Button
      disabled={isMultiplayer && selectedAnswer != null}
      onClick={() => {
        // Use the callback if provided with the FULL answer
        if (onAnswerSelected) {
          onAnswerSelected(fullAnswer);
        } else {
          dispatch({ type: "SET_SELECTED_ANSWER", payload: fullAnswer });
        }

        // Keep the existing multiplayer validation with FULL answer
        if (isMultiplayer && currentQuiz) {
          dispatch({
            type: "VALIDATE_ANSWER",
            payload: {
              question: currentQuiz.quiz[questionNumber].text,
              correctAnswer:
                currentQuiz.quiz[questionNumber].correctAnswer!.slice(3),
              userAnswer: answer,
            },
          });
        }
      }}
      className="group my-3 w-full h-auto justify-start rounded-lg border border-primary border-opacity-30 bg-white dark:bg-black p-7 text-sm font-normal text-black dark:text-white hover:border-none hover:bg-primary hover:text-white dark:hover:text-black focus:bg-primary focus:text-white dark:focus:text-black sm:text-lg dark:hover:bg-primary dark:focus:bg-primary "
    >
      <span
        id="letter"
        className="me-4 rounded-md border border-primary/60 border-opacity-20 px-2 py-1 text-base group-hover:border-white dark:group-hover:border-black group-focus:border-white dark:group-focus:border-black sm:text-2xl"
      >
        {letter}
      </span>
      <span id="answer" className="capitalize break-words whitespace-normal text-left">
        {answer}
      </span>
    </Button>
  );
};

export default Answer;
