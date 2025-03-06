"use client";

import React from "react";
import { Quiz } from "@/contexts/quiz-context";
import Answer from "@/components/single-player-quiz/answer";
import { Button } from "@/components/ui/button";
import { useQuizLogic } from "@/contexts/quiz-logic-context";

type Props = {
  quiz: Quiz[];
  questionNumber: number;
  userAnswer: string | null;
  correctAnswer?: string;
  onAnswerSelected?: (answer: string) => void;
};

const QAndA = ({
  quiz,
  questionNumber,
  userAnswer,
  correctAnswer,
  onAnswerSelected,
}: Props) => {
  const questionsAndAnswers = quiz[questionNumber] as Quiz;
  let { options: answers, text: question } = questionsAndAnswers;
  const { showCorrectAnswer } = useQuizLogic();

  return (
    <section>
      <h1 className="w-full items-center rounded-md bg-primary p-6 text-center text-base font-bold text-black sm:text-2xl">
        {question}
      </h1>
      <div className="mt-4 w-auto">
        {showCorrectAnswer && correctAnswer ? (
          <>
            <button
              className={`group my-3 w-full justify-start rounded-lg p-4 text-sm font-normal text-white sm:text-lg ${
                userAnswer === correctAnswer ? "bg-green-500" : "bg-red-500"
              }`}
            >
              <span id="answer" className="capitalize">
                Your Answer: {userAnswer}
              </span>
            </button>

            <button className="group my-3 w-full justify-start rounded-lg bg-black p-4 text-sm font-normal text-white  sm:text-lg">
              <span id="answer" className="capitalize">
                Correct Answer: {correctAnswer.slice(3)}
              </span>
            </button>
          </>
        ) : (
          answers.map((answer, i) => {
            return (
              <Answer
                key={i}
                answer={answer.slice(3)}
                letter={answer.substring(0, 3)}
                onAnswerSelected={onAnswerSelected}
              ></Answer>
            );
          })
        )}
      </div>
    </section>
  );
};

export default QAndA;
