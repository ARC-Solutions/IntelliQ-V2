'use client';
import React from 'react';
import { Quiz } from '@/contexts/quiz-context';
import Answer from '@/components/single-player-quiz/answer';
type Props = {
  quiz: Quiz[];
  questionNumber: number;
};

const QAndA = ({ quiz, questionNumber }: Props) => {
  const questionsAndAnswers = quiz[questionNumber] as Quiz;
  let { options: answers, text: question } = questionsAndAnswers;
  return (
    <section>
      <h1 className='w-full items-center rounded-md bg-primary p-6 text-center text-base font-bold text-black sm:text-2xl'>
        {question}
      </h1>
      <div className='mt-4 w-auto'>
        {answers.map((answer, i) => {
          return <Answer key={i} answer={answer.slice(3)} letter={answer.substring(0, 3)}></Answer>;
        })}
      </div>
    </section>
  );
};

export default QAndA;
