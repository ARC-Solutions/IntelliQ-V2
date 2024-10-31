'use client';
import { useQuiz } from '@/contexts/quiz-context';
import React, { useEffect } from 'react';

const Summary = () => {
  const { dispatch } = useQuiz();
  useEffect(() => {
    dispatch({ type: 'RESET_QUIZ' });
  }, []);
  return <div>Summary</div>;
};

export default Summary;
