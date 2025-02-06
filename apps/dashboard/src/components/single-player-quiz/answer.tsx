"use client";
import { useQuizLogic } from "@/contexts/quiz-logic-context";
import { Button } from "@/components/ui/button";
import { useQuiz } from "@/contexts/quiz-context";

type Props = {
  answer: string;
  letter: string;
};

const Answer = ({ answer, letter }: Props) => {
  const { dispatch, selectedAnswer, questionNumber, isMultiplayer } =
    useQuizLogic();
  const { currentQuiz } = useQuiz();

  return (
    <Button
      disabled={isMultiplayer && selectedAnswer != null}
      onClick={() => {
        dispatch({ type: "SET_SELECTED_ANSWER", payload: answer });
        // Validate answer immediately when selected
        if (isMultiplayer && currentQuiz) {
          dispatch({
            type: "VALIDATE_ANSWER",
            payload: {
              question: currentQuiz.quiz[questionNumber].text,
              correctAnswer:
                currentQuiz.quiz[questionNumber].correctAnswer.slice(3),
              userAnswer: answer,
            },
          });
        }
      }}
      className="group my-3 w-full justify-start rounded-lg border border-primary border-opacity-30 bg-white dark:bg-black p-7 text-sm font-normal text-black dark:text-white hover:border-none hover:text-white dark:hover:text-black focus:bg-primary focus:text-black sm:text-lg"
    >
      <span
        id="letter"
        className="me-4 rounded-md border border-primary/60 border-opacity-20 px-2 py-1 text-base group-hover:border-white dark:group-hover:border-black group-focus:border-black sm:text-2xl"
      >
        {letter}
      </span>
      <span id="answer" className="capitalize">
        {answer}
      </span>
    </Button>
  );
};

export default Answer;
