import { HistoryQuestions } from '@/contexts/quiz-context';
import React from 'react';
import { CircleX, CircleCheck } from 'lucide-react';

const QuestionsList = ({ questions }: { questions: HistoryQuestions[] }) => {
  return (
    <div className='mt-4 w-full'>
      {questions.map((question, index) => (
        <div
          key={index}
          className='mb-6 border border-opacity-20 rounded-md p-4 bg-opacity-10'
          style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}
        >
          <h3 className='text-lg font-semibold'>Question {index + 1}</h3>
          <p className='mt-2 text-base'>{question.text}</p>
          <div className='mt-4'>
            <p className='text-base flex gap-2'>
              <span className='font-semibold'>Your Answer: </span>
              <span
                className={`${
                  question.userAnswer === question.correctAnswer ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {question.userAnswer}{' '}
              </span>
              <span>
                {question.userAnswer === question.correctAnswer ? (
                  <CircleCheck color='#22c55e' />
                ) : (
                  <CircleX color='#ef4444' />
                )}
              </span>
            </p>
            {question.userAnswer !== question.correctAnswer && (
              <p className='text-base mt-1'>
                <span className='font-semibold'>Correct Answer: </span>
                <span className='text-blue-400'>{question.correctAnswer}</span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuestionsList;
