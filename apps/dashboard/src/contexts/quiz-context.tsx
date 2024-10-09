'use client';

import React, { createContext, useContext, useReducer } from 'react';
import { toast } from 'react-toastify';
import { useSupabase } from './supabase-context';
import { quizReducer } from '@/utils/reducers/quiz-reducer';
import { UserAnswer } from '@/contexts/quiz-logic-context';

type Props = {
  children: React.ReactNode;
};
export interface Quiz {
  correctAnswer: string;
  options: string[];
  text: string;
  questionTitle: string;
}
export interface HistoryQuestions {
  correctAnswer: string;
  text: string;
  userAnswer: string;
}
interface CurrentQuiz {
  quiz: Quiz[];
  topic: string;
}
export interface QuizHistory {
  quiz_id: string;
  rawQuestions: {
    timeTaken: number;
    quiz_title: string;
    correctAnswersCount: number;
    questions: HistoryQuestions[];
  };
}
export interface QuizContextValue {
  isLoading: boolean;
  fetchingFinished: boolean;
  currentQuiz: CurrentQuiz | null;
  summaryQuiz: QuizHistory | null;
  quizzes: QuizHistories[] | null;
}
export interface QuizHistories {
  id: string;
  quiz_title: string;
  created_at: string;
}
export type QuizAction =
  | { type: 'FETCH_QUIZ_REQUEST' }
  | { type: 'FETCH_QUIZ_ERROR' }
  | { type: 'RESET_QUIZ' }
  | { type: 'RESET_ALL' }
  | { type: 'RESET_SUMMARY_QUIZ' }
  | { type: 'FETCH_QUIZ_SUCCESS'; payload: CurrentQuiz }
  | { type: 'SUBMIT_QUIZ_SUCESS'; payload: QuizHistory }
  | { type: 'STORE_QUIZZES'; payload: QuizHistories[] }
  | { type: 'FETCH_MORE_QUIZZES'; payload: QuizHistories[] };

export interface QuizContextValues extends QuizContextValue {
  dispatch: React.Dispatch<QuizAction>;
  fetchQuestions: (interests: string, numberOfQuestions: number) => void;
  submitQuiz: (userAnswer: UserAnswer[], timeTaken: number) => void;
  fetchSingleQuiz: (quizID: string) => void;
}
const initialState: QuizContextValue = {
  isLoading: false,
  fetchingFinished: false,
  currentQuiz: null,
  // currentQuiz: {
  //   topic: 'C#',
  //   quiz: [
  //     {
  //       questionTitle: 'Nice',
  //       correctAnswer: 'c) string',
  //       options: [
  //         'a) int',
  //         'b) float',
  //         'c) string',
  //         'd) boolean',
  //       ],
  //       text: 'Which of the following is NOT a primitive data type in C#?',
  //     },
  //     {
  //       questionTitle: 'Nice',
  //       correctAnswer: 'a) class',
  //       options: ['a) class', 'b) struct', 'c) interface', 'd) enum'],
  //       text: 'Which keyword is used to define a class in C#?',
  //     },
  //     {
  //       questionTitle: 'Nice',
  //       correctAnswer: 'c) To import a namespace',
  //       options: [
  //         'a) To declare a new variable.',
  //         'b) To define a class',
  //         'c) To import a namespace',
  //         'd) To create a loop',
  //       ],
  //       text: 'What is the purpose of the using directive in C#?',
  //     },
  //   ],
  // },

  summaryQuiz: null,
  quizzes: null,
};

const QuizContext = createContext<QuizContextValues | null>(null);

export const QuizProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const { supabase } = useSupabase();
  const fetchQuestions = async (interests: string, numberOfQuestions: number) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/quiz`;
      dispatch({ type: 'FETCH_QUIZ_REQUEST' });
      const url = `${URL}?numberOfQuestions=${numberOfQuestions}&interests=${interests}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      const { quizTitle: topic, questions } = data.rawQuestions[0];

      const quiz: CurrentQuiz = {
        quiz: questions,
        topic,
      };
      dispatch({ type: 'FETCH_QUIZ_SUCCESS', payload: quiz });
    } catch (error: any) {
      dispatch({ type: 'FETCH_QUIZ_ERROR' });
      toast.error(error);
    }
  };
  const submitQuiz = async (userAnswer: UserAnswer[], timeTaken: number) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      const quizTitle = state.currentQuiz?.topic;
      const questions = userAnswer.map((ans, i) => {
        const { correctAnswer, question, userAnswer } = ans;
        const options = state.currentQuiz?.quiz[i].options.map((opt) => opt.slice(3));
        return { text: question, correctAnswer, userAnswer, options };
      });

      const rawQuestions = {
        quizTitle,
        questions,
        timeTaken,
      };
      const URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/submit-quiz`;
      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ rawQuestions }),
      });
      const data = (await response.json()) as QuizHistory;
      console.log(data);

      dispatch({ type: 'SUBMIT_QUIZ_SUCESS', payload: data });
    } catch (error: any) {
      toast(error.message);
      console.log(error);
    }
  };

  const fetchSingleQuiz = async (quizID: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      const URL = `${process.env.NEXT_PUBLIC_BASE_URL}/quizzes/${quizID}`;
      const response = await fetch(URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response.json()) as QuizHistory;
      console.log(data);
      dispatch({ type: 'SUBMIT_QUIZ_SUCESS', payload: data });
    } catch (error: any) {
      toast(error.message);
      console.log(error);
    }
  };
  return (
    <QuizContext.Provider
      value={{
        ...state,
        dispatch,
        fetchQuestions,
        submitQuiz,
        fetchSingleQuiz,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = (): QuizContextValues => {
  const quizContext = useContext(QuizContext);
  if (quizContext === undefined) {
    throw new Error('useQuiz must be used within an QuizProvider');
  }
  return quizContext as QuizContextValues;
};
