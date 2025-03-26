'use client';

import type React from 'react';
import { createContext, useContext, useReducer, useState } from 'react';
import { toast } from 'react-toastify';
import { quizReducer } from '@/utils/reducers/quiz-reducer';
import type { UserAnswer } from '@/contexts/quiz-logic-context';
import type { QuizData } from './quiz-creation-context';
import { createApiClient } from '@/utils/api-client';

type Props = {
  children: React.ReactNode;
};
export enum SupportedLanguages {
  English = 'en',
  German = 'de',
  French = 'fr',
  Spanish = 'es',
  Italian = 'it',
  Romanian = 'ro',
  Serbian = 'sr',
  Tagalog = 'tl',
  Polish = 'pl',
}
export interface Quiz {
  correctAnswer?: string;
  options: string[];
  text: string;
  questionTitle: string;
  id?: string;
}
export interface HistoryQuestions {
  correctAnswer: string;
  text: string;
  userAnswer: string;
}
interface CurrentQuiz {
  quizId?: string;
  quiz: Quiz[];
  topic: string;
  showCorrectAnswers: boolean;
  documentId?: string;
  language?: SupportedLanguages;
  passingScore?: number;
}

export interface QuizHistory {
  quizId: string;
  quizTitle: string;
  quizScore: number;
  totalTime: number;
  correctAnswersCount: number;
  totalQuestions: number;
  passingScore: number;
  questions: HistoryQuestions[];
}
export interface MultiplayerLeaderboardQuestions {
  text: string;
  correctAnswer: string;
  userAnswer: string;
  timeTaken: number;
}

export interface Leaderboard {
  userName: string;
  userId: string;
  score: number;
  correctAnswers: number;
  avgTimeTaken: number;
  totalQuestions: number;
  questions: MultiplayerLeaderboardQuestions[];
}
export interface QuizContextValue {
  isLoading: boolean;
  fetchingFinished: boolean;
  currentQuiz: CurrentQuiz | null;
  summaryQuiz: QuizHistory | null;
  leaderboard: Leaderboard[] | null;
  quizzes: QuizHistories[] | null;
}
export interface QuizHistories {
  id: string;
  quiz_title: string;
  created_at: string;
  score: number | null;
  correct: number | null;
  incorrect: number | null;
  totalTime: string;
  tags: string[];
}
export type QuizAction =
  | { type: 'FETCH_QUIZ_REQUEST' }
  | { type: 'FETCH_QUIZ_ERROR' }
  | { type: 'RESET_QUIZ' }
  | { type: 'RESET_ALL' }
  | { type: 'FETCH_QUIZ_SUCCESS'; payload: CurrentQuiz }
  | { type: 'SUBMIT_QUIZ_SUCESS'; payload: QuizHistory }
  | { type: 'STORE_QUIZZES'; payload: QuizHistories[] }
  | { type: 'FETCH_MORE_QUIZZES'; payload: QuizHistories[] }
  | { type: 'FETCH_LEADERBOARD_SUCCESS'; payload: Leaderboard[] };

export interface QuizContextValues extends QuizContextValue {
  dispatch: React.Dispatch<QuizAction>;
  fetchQuestions: (userQuizData: QuizData, roomId?: string) => void;
  fetchDocumentQuestions: (userQuizData: QuizData) => void;
  submitSinglePlayerQuiz: (
    userAnswer: UserAnswer[],
    timeTaken: number,
    currentQuiz: CurrentQuiz,
    userScore: number,
    description: string,
    language: SupportedLanguages,
    topic: string,
    passingScore: number,
    tags: string[],
  ) => void;
  submitDocumentQuiz: (
    userAnswer: UserAnswer[],
    timeTaken: number,
    currentQuiz: CurrentQuiz,
    userScore: number,
    documentId: string,
    language: SupportedLanguages,
    passingScore: number,
  ) => void;
  getMultiplayerQuizForPlayers: (roomId: string, quiz: CurrentQuiz) => void;
  isMultiplayerMode: boolean;
  setIsMultiplayerMode: (mode: boolean) => void;
  getLeaderboard: (roomId: string) => void;
  isDocumentQuiz: boolean;
  setIsDocumentQuiz: (value: boolean) => void;
  getSinglePlayerSummary: (quizId: string) => void;
}
const initialState: QuizContextValue = {
  isLoading: false,
  fetchingFinished: false,
  currentQuiz: null,
  leaderboard: null,
  // leaderboard: [
  //   {
  //     userName: 'John Doe',
  //     userId: '16098146-8406-42b3-8c86-2b3119963494',
  //     score: 3248,
  //     correctAnswers: 4,
  //     avgTimeTaken: 9056.25,
  //     totalQuestions: 5,
  //     questions: [
  //       {
  //         text: 'In which year was the first Formula 1 World Championship held?',
  //         correctAnswer: 'b) 1950',
  //         userAnswer: 'b) 1950',
  //         timeTaken: 9990,
  //       },
  //       {
  //         text: 'Which driver holds the record for the most World Championships in Formula 1?',
  //         correctAnswer: 'b) Lewis Hamilton',
  //         userAnswer: 'b) Lewis Hamilton',
  //         timeTaken: 7737,
  //       },
  //       {
  //         text: "Which of the following circuits is known as 'The Temple of Speed'?",
  //         correctAnswer: 'a) Monza',
  //         userAnswer: 'a) Monza',
  //         timeTaken: 7672,
  //       },
  //       {
  //         text: "Which team has won the most Constructors' Championships in Formula 1 history?",
  //         correctAnswer: 'a) Ferrari',
  //         userAnswer: 'b) McLaren',
  //         timeTaken: 5144,
  //       },
  //       {
  //         text: 'What is the fastest recorded lap in Formula 1 history (as of 2023)?',
  //         correctAnswer: 'c) 1:12.908',
  //         userAnswer: 'c) 1:12.908',
  //         timeTaken: 7686,
  //       },
  //     ],
  //   },
  //   {
  //     userName: 'Nippon Lama',
  //     userId: '02607b81-16b0-4831-ba8a-16cdab27ceba',
  //     score: 2687,
  //     correctAnswers: 3,
  //     avgTimeTaken: 4709.55,
  //     totalQuestions: 5,
  //     questions: [
  //       {
  //         text: 'In which year was the first Formula 1 World Championship held?',
  //         correctAnswer: 'b) 1950',
  //         userAnswer: 'a) 1946',
  //         timeTaken: 8833,
  //       },
  //       {
  //         text: 'Which driver holds the record for the most World Championships in Formula 1?',
  //         correctAnswer: 'b) Lewis Hamilton',
  //         userAnswer: 'b) Lewis Hamilton',
  //         timeTaken: 5596,
  //       },
  //       {
  //         text: "Which of the following circuits is known as 'The Temple of Speed'?",
  //         correctAnswer: 'a) Monza',
  //         userAnswer: 'a) Monza',
  //         timeTaken: 4710,
  //       },
  //       {
  //         text: "Which team has won the most Constructors' Championships in Formula 1 history?",
  //         correctAnswer: 'a) Ferrari',
  //         userAnswer: 'a) Ferrari',
  //         timeTaken: 3467,
  //       },
  //       {
  //         text: 'What is the fastest recorded lap in Formula 1 history (as of 2023)?',
  //         correctAnswer: 'c) 1:12.908',
  //         userAnswer: 'a) 1:14.260',
  //         timeTaken: 4147,
  //       },
  //     ],
  //   },
  //   {
  //     userName: 'arc admin',
  //     userId: '0a63b60e-3c17-42b8-9924-8c337a43de1f',
  //     score: 2467,
  //     correctAnswers: 3,
  //     avgTimeTaken: 7907.67,
  //     totalQuestions: 5,
  //     questions: [
  //       {
  //         text: 'In which year was the first Formula 1 World Championship held?',
  //         correctAnswer: 'b) 1950',
  //         userAnswer: 'b) 1950',
  //         timeTaken: 10468,
  //       },
  //       {
  //         text: 'Which driver holds the record for the most World Championships in Formula 1?',
  //         correctAnswer: 'b) Lewis Hamilton',
  //         userAnswer: 'b) Lewis Hamilton',
  //         timeTaken: 6748,
  //       },
  //       {
  //         text: "Which of the following circuits is known as 'The Temple of Speed'?",
  //         correctAnswer: 'a) Monza',
  //         userAnswer: 'a) Monza',
  //         timeTaken: 6259,
  //       },
  //       {
  //         text: "Which team has won the most Constructors' Championships in Formula 1 history?",
  //         correctAnswer: 'a) Ferrari',
  //         userAnswer: 'b) McLaren',
  //         timeTaken: 4328,
  //       },
  //       {
  //         text: 'What is the fastest recorded lap in Formula 1 history (as of 2023)?',
  //         correctAnswer: 'c) 1:12.908',
  //         userAnswer: 'b) 1:13.553',
  //         timeTaken: 6122,
  //       },
  //     ],
  //   },
  //   {
  //     userName: 'arc admin',
  //     userId: '0a63b60e-3c17-42b8-9924-8c337a43de1f',
  //     score: 2467,
  //     correctAnswers: 3,
  //     avgTimeTaken: 7907.67,
  //     totalQuestions: 5,
  //     questions: [
  //       {
  //         text: 'In which year was the first Formula 1 World Championship held?',
  //         correctAnswer: 'b) 1950',
  //         userAnswer: 'b) 1950',
  //         timeTaken: 10468,
  //       },
  //       {
  //         text: 'Which driver holds the record for the most World Championships in Formula 1?',
  //         correctAnswer: 'b) Lewis Hamilton',
  //         userAnswer: 'b) Lewis Hamilton',
  //         timeTaken: 6748,
  //       },
  //       {
  //         text: "Which of the following circuits is known as 'The Temple of Speed'?",
  //         correctAnswer: 'a) Monza',
  //         userAnswer: 'a) Monza',
  //         timeTaken: 6259,
  //       },
  //       {
  //         text: "Which team has won the most Constructors' Championships in Formula 1 history?",
  //         correctAnswer: 'a) Ferrari',
  //         userAnswer: 'b) McLaren',
  //         timeTaken: 4328,
  //       },
  //       {
  //         text: 'What is the fastest recorded lap in Formula 1 history (as of 2023)?',
  //         correctAnswer: 'c) 1:12.908',
  //         userAnswer: 'b) 1:13.553',
  //         timeTaken: 6122,
  //       },
  //     ],
  //   },
  //   {
  //     userName: 'arc admin',
  //     userId: '0a63b60e-3c17-42b8-9924-8c337a43de1f',
  //     score: 2467,
  //     correctAnswers: 3,
  //     avgTimeTaken: 7907.67,
  //     totalQuestions: 5,
  //     questions: [
  //       {
  //         text: 'In which year was the first Formula 1 World Championship held?',
  //         correctAnswer: 'b) 1950',
  //         userAnswer: 'b) 1950',
  //         timeTaken: 10468,
  //       },
  //       {
  //         text: 'Which driver holds the record for the most World Championships in Formula 1?',
  //         correctAnswer: 'b) Lewis Hamilton',
  //         userAnswer: 'b) Lewis Hamilton',
  //         timeTaken: 6748,
  //       },
  //       {
  //         text: "Which of the following circuits is known as 'The Temple of Speed'?",
  //         correctAnswer: 'a) Monza',
  //         userAnswer: 'a) Monza',
  //         timeTaken: 6259,
  //       },
  //       {
  //         text: "Which team has won the most Constructors' Championships in Formula 1 history?",
  //         correctAnswer: 'a) Ferrari',
  //         userAnswer: 'b) McLaren',
  //         timeTaken: 4328,
  //       },
  //       {
  //         text: 'What is the fastest recorded lap in Formula 1 history (as of 2023)?',
  //         correctAnswer: 'c) 1:12.908',
  //         userAnswer: 'b) 1:13.553',
  //         timeTaken: 6122,
  //       },
  //     ],
  //   },
  //   {
  //     userName: 'arc admin',
  //     userId: '0a63b60e-3c17-42b8-9924-8c337a43de1f',
  //     score: 2467,
  //     correctAnswers: 3,
  //     avgTimeTaken: 7907.67,
  //     totalQuestions: 5,
  //     questions: [
  //       {
  //         text: 'In which year was the first Formula 1 World Championship held?',
  //         correctAnswer: 'b) 1950',
  //         userAnswer: 'b) 1950',
  //         timeTaken: 10468,
  //       },
  //       {
  //         text: 'Which driver holds the record for the most World Championships in Formula 1?',
  //         correctAnswer: 'b) Lewis Hamilton',
  //         userAnswer: 'b) Lewis Hamilton',
  //         timeTaken: 6748,
  //       },
  //       {
  //         text: "Which of the following circuits is known as 'The Temple of Speed'?",
  //         correctAnswer: 'a) Monza',
  //         userAnswer: 'a) Monza',
  //         timeTaken: 6259,
  //       },
  //       {
  //         text: "Which team has won the most Constructors' Championships in Formula 1 history?",
  //         correctAnswer: 'a) Ferrari',
  //         userAnswer: 'b) McLaren',
  //         timeTaken: 4328,
  //       },
  //       {
  //         text: 'What is the fastest recorded lap in Formula 1 history (as of 2023)?',
  //         correctAnswer: 'c) 1:12.908',
  //         userAnswer: 'b) 1:13.553',
  //         timeTaken: 6122,
  //       },
  //     ],
  //   },
  //   {
  //     userName: 'arc admin',
  //     userId: '0a63b60e-3c17-42b8-9924-8c337a43de1f',
  //     score: 2467,
  //     correctAnswers: 3,
  //     avgTimeTaken: 7907.67,
  //     totalQuestions: 5,
  //     questions: [
  //       {
  //         text: 'In which year was the first Formula 1 World Championship held?',
  //         correctAnswer: 'b) 1950',
  //         userAnswer: 'b) 1950',
  //         timeTaken: 10468,
  //       },
  //       {
  //         text: 'Which driver holds the record for the most World Championships in Formula 1?',
  //         correctAnswer: 'b) Lewis Hamilton',
  //         userAnswer: 'b) Lewis Hamilton',
  //         timeTaken: 6748,
  //       },
  //       {
  //         text: "Which of the following circuits is known as 'The Temple of Speed'?",
  //         correctAnswer: 'a) Monza',
  //         userAnswer: 'a) Monza',
  //         timeTaken: 6259,
  //       },
  //       {
  //         text: "Which team has won the most Constructors' Championships in Formula 1 history?",
  //         correctAnswer: 'a) Ferrari',
  //         userAnswer: 'b) McLaren',
  //         timeTaken: 4328,
  //       },
  //       {
  //         text: 'What is the fastest recorded lap in Formula 1 history (as of 2023)?',
  //         correctAnswer: 'c) 1:12.908',
  //         userAnswer: 'b) 1:13.553',
  //         timeTaken: 6122,
  //       },
  //     ],
  //   },
  //   {
  //     userName: 'arc admin',
  //     userId: '0a63b60e-3c17-42b8-9924-8c337a43de1f',
  //     score: 2467,
  //     correctAnswers: 3,
  //     avgTimeTaken: 7907.67,
  //     totalQuestions: 5,
  //     questions: [
  //       {
  //         text: 'In which year was the first Formula 1 World Championship held?',
  //         correctAnswer: 'b) 1950',
  //         userAnswer: 'b) 1950',
  //         timeTaken: 10468,
  //       },
  //       {
  //         text: 'Which driver holds the record for the most World Championships in Formula 1?',
  //         correctAnswer: 'b) Lewis Hamilton',
  //         userAnswer: 'b) Lewis Hamilton',
  //         timeTaken: 6748,
  //       },
  //       {
  //         text: "Which of the following circuits is known as 'The Temple of Speed'?",
  //         correctAnswer: 'a) Monza',
  //         userAnswer: 'a) Monza',
  //         timeTaken: 6259,
  //       },
  //       {
  //         text: "Which team has won the most Constructors' Championships in Formula 1 history?",
  //         correctAnswer: 'a) Ferrari',
  //         userAnswer: 'b) McLaren',
  //         timeTaken: 4328,
  //       },
  //       {
  //         text: 'What is the fastest recorded lap in Formula 1 history (as of 2023)?',
  //         correctAnswer: 'c) 1:12.908',
  //         userAnswer: 'b) 1:13.553',
  //         timeTaken: 6122,
  //       },
  //     ],
  //   },
  //   {
  //     userName: 'arc admin',
  //     userId: '0a63b60e-3c17-42b8-9924-8c337a43de1f',
  //     score: 2467,
  //     correctAnswers: 3,
  //     avgTimeTaken: 7907.67,
  //     totalQuestions: 5,
  //     questions: [
  //       {
  //         text: 'In which year was the first Formula 1 World Championship held?',
  //         correctAnswer: 'b) 1950',
  //         userAnswer: 'b) 1950',
  //         timeTaken: 10468,
  //       },
  //       {
  //         text: 'Which driver holds the record for the most World Championships in Formula 1?',
  //         correctAnswer: 'b) Lewis Hamilton',
  //         userAnswer: 'b) Lewis Hamilton',
  //         timeTaken: 6748,
  //       },
  //       {
  //         text: "Which of the following circuits is known as 'The Temple of Speed'?",
  //         correctAnswer: 'a) Monza',
  //         userAnswer: 'a) Monza',
  //         timeTaken: 6259,
  //       },
  //       {
  //         text: "Which team has won the most Constructors' Championships in Formula 1 history?",
  //         correctAnswer: 'a) Ferrari',
  //         userAnswer: 'b) McLaren',
  //         timeTaken: 4328,
  //       },
  //       {
  //         text: 'What is the fastest recorded lap in Formula 1 history (as of 2023)?',
  //         correctAnswer: 'c) 1:12.908',
  //         userAnswer: 'b) 1:13.553',
  //         timeTaken: 6122,
  //       },
  //     ],
  //   },
  // ],
  // currentQuiz: {
  //   topic: 'C#',
  //   showCorrectAnswers: true,
  //   quiz: [
  //     {
  //       questionTitle: 'Nice',
  //       correctAnswer: 'c) string',
  //       options: ['a) int', 'b) float', 'c) string', 'd) boolean'],
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
  // summaryQuiz: {
  //   quizId: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
  //   quizTitle: 'HEHE QUIZ',
  //   quizScore: 124,
  //   totalTime: 1230,
  //   correctAnswersCount: 4,
  //   totalQuestions: 5,
  //   questions: [
  //     {
  //       text: 'Which of the following is NOT a primitive data type in C#?',
  //       correctAnswer: 'string',
  //       userAnswer: 'hehe',
  //     },
  //     {
  //       text: 'What is the purpose of the using directive in C#?',
  //       correctAnswer: 'To import a namespace',
  //       userAnswer: 'To import a namespace',
  //     },
  //     {
  //       text: 'Which keyword is used to define a class in C#?',
  //       correctAnswer: 'class',
  //       userAnswer: 'hehe',
  //     },
  //     {
  //       text: 'Which keyword is used to define a class in C#?',
  //       correctAnswer: 'class',
  //       userAnswer: 'class',
  //     },
  //     {
  //       text: 'Which keyword is used to define a class in C#?',
  //       correctAnswer: 'class',
  //       userAnswer: 'hehe',
  //     },
  //   ],
  //   passingScore: 80,
  // },
  quizzes: null,
};

const QuizContext = createContext<QuizContextValues | null>(null);

export const QuizProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const [isMultiplayerMode, setIsMultiplayerMode] = useState(false);
  const [isDocumentQuiz, setIsDocumentQuiz] = useState(false);
  const fetchQuestions = async (userQuizData: QuizData, roomId?: string) => {
    try {
      console.log('generating...');

      const {
        topic: interests,
        number: numberOfQuestions,
        quizLanguage: language,
        quizType,
      } = userQuizData;

      const client = createApiClient();
      dispatch({ type: 'FETCH_QUIZ_REQUEST' });

      const query =
        quizType === 'multiplayer'
          ? {
              quizTopic: interests,
              numberOfQuestions: numberOfQuestions.toString(),
              language,
              quizType,
            }
          : {
              quizTopic: interests,
              quizDescription: userQuizData.description!,
              numberOfQuestions: numberOfQuestions.toString(),
              quizTags: userQuizData.tags,
              language,
              quizType,
            };

      const response = await client.api.v1.quizzes.generate.$get({
        query,
      });

      interface QuizApiResponse {
        quiz: {
          quizTitle: string;
          questions: Quiz[];
        };
      }

      const data = (await response.json()) as QuizApiResponse;
      const { quizTitle: topic, questions } = data.quiz;

      const userQuizQuestions = userQuizData.questions.map((question) => {
        return {
          correctAnswer: question.answer!,
          options: question.options!,
          questionTitle: question.text,
          text: question.text,
        };
      });
      questions.push(...userQuizQuestions);
      const quiz: CurrentQuiz = {
        quiz: questions,
        topic,
        showCorrectAnswers: userQuizData.showCorrectAnswers,
      };

      if (quizType === 'multiplayer' && roomId) {
        const multiplayerQuiz = await submitMultiplayerQuiz(roomId, quiz, interests, language);
        if (multiplayerQuiz && 'questions' in multiplayerQuiz) {
          quiz.quiz = multiplayerQuiz.questions as Quiz[];
          quiz.quizId = multiplayerQuiz.quizId;
        }
      }
      dispatch({ type: 'FETCH_QUIZ_SUCCESS', payload: quiz });
    } catch (error: any) {
      dispatch({ type: 'FETCH_QUIZ_ERROR' });
      toast.error(error);
    }
  };
  const fetchDocumentQuestions = async (userQuizData: QuizData) => {
    try {
      setIsDocumentQuiz(true);

      const {
        documentId,
        number: numberOfQuestions,
        quizLanguage: language,
        passingScore,
        quizType,
      } = userQuizData;

      const client = createApiClient();
      dispatch({ type: 'FETCH_QUIZ_REQUEST' });
      const response = await client.api.v1.quizzes.documents.$get({
        query: {
          documentId: documentId!,
          numberOfQuestions: numberOfQuestions.toString(),
          language,
          quizType,
        },
      });

      interface QuizApiResponse {
        quiz: {
          quizTitle: string;
          questions: Quiz[];
        };
      }

      const data = (await response.json()) as QuizApiResponse;
      const { quizTitle: topic, questions } = data.quiz;

      const userQuizQuestions = userQuizData.questions.map((question) => {
        return {
          correctAnswer: question.answer!,
          options: question.options!,
          questionTitle: question.text,
          text: question.text,
        };
      });
      questions.push(...userQuizQuestions);
      const quiz: CurrentQuiz = {
        quiz: questions,
        topic,
        showCorrectAnswers: userQuizData.showCorrectAnswers,
        documentId,
        language: language,
        passingScore: passingScore,
      };

      dispatch({ type: 'FETCH_QUIZ_SUCCESS', payload: quiz });
    } catch (error: any) {
      dispatch({ type: 'FETCH_QUIZ_ERROR' });
      toast.error(error);
    }
  };
  const submitSinglePlayerQuiz = async (
    userAnswer: UserAnswer[],
    timeTaken: number,
    currentQuiz: CurrentQuiz,
    userScore: number,
    description: string,
    language: SupportedLanguages,
    topic: string,
    passingScore: number,
    tags: string[],
  ) => {
    try {
      const client = createApiClient();

      const quizTitle = currentQuiz.topic;
      const questions = userAnswer.map((ans, i) => {
        const { correctAnswer, question, userAnswer } = ans;
        const options = currentQuiz.quiz[i].options.map((opt) => opt.slice(3));
        if (!userAnswer) {
          throw new Error('Missing user answer');
        }
        return { text: question, correctAnswer, userAnswer, options };
      });

      const response = await client.api.v1['quiz-submissions'].singleplayer.submit.$post({
        json: {
          timeTaken,
          quizTitle,
          description,
          language,
          passingScore,
          topic: [topic],
          tags,
          userScore,
          questions,
        },
      });
      const data = (await response.json()) as QuizHistory;

      dispatch({ type: 'SUBMIT_QUIZ_SUCESS', payload: data });
    } catch (error: any) {
      toast(error.message);
      console.log(error);
    }
  };

  const getMultiplayerQuizForPlayers = async (roomId: string, quiz: CurrentQuiz) => {
    try {
      const client = createApiClient();

      const response = await client.api.v1['quiz-submissions'].multiplayer[
        ':roomId'
      ].questions.$get({
        param: { roomId },
      });
      const data = await response.json();

      if ('error' in data) {
        throw new Error(data.error);
      }

      const currentQuiz = { ...quiz, quiz: data.questions } as CurrentQuiz;
      console.log('player', currentQuiz);

      dispatch({ type: 'FETCH_QUIZ_SUCCESS', payload: currentQuiz });
    } catch (error: any) {
      toast(error.message);
      console.log(error);
    }
  };

  const submitMultiplayerQuiz = async (
    roomId: string,
    currentQuiz: CurrentQuiz,
    quizTopics: string,
    language: SupportedLanguages,
  ) => {
    try {
      const client = createApiClient();
      const { quiz: questions, topic: quizTitle } = currentQuiz;
      const formattedQuestions = questions.map((q) => ({
        ...q,
        correctAnswer: q.correctAnswer || '', // Provide default empty string
      }));

      const response = await client.api.v1['quiz-submissions'].multiplayer[':roomId'].quiz.$post({
        param: { roomId },
        json: {
          language,
          questions: formattedQuestions,
          quizTitle,
          quizTopics: [quizTopics],
        },
      });

      const data = await response.json();
      console.log('succesfull', data);

      return data;
    } catch (error: any) {
      toast(error.message);
      console.log(error);
    }
  };

  const getLeaderboard = async (roomId: string) => {
    try {
      const client = createApiClient();
      const response = await client.api.v1['quiz-submissions'].multiplayer[
        ':roomId'
      ].leaderboard.$get({
        param: { roomId },
      });

      const data = await response.json();
      dispatch({
        type: 'FETCH_LEADERBOARD_SUCCESS',
        payload: data.leaderboard,
      });
    } catch (error: any) {
      toast(error.message);
      console.log(error);
    }
  };

  const submitDocumentQuiz = async (
    userAnswer: UserAnswer[],
    timeTaken: number,
    currentQuiz: CurrentQuiz,
    userScore: number,
    documentId: string,
    language: SupportedLanguages,
    passingScore: number,
  ) => {
    try {
      const client = createApiClient();

      const quizTitle = currentQuiz.topic;
      const questions = userAnswer.map((ans, i) => {
        const { correctAnswer, question, userAnswer } = ans;
        const options = currentQuiz.quiz[i].options.map((opt) => opt.slice(3));
        if (!userAnswer) {
          throw new Error('Missing user answer');
        }
        return { text: question, correctAnswer, userAnswer, options };
      });

      const quizLanguage = language || (currentQuiz as any).language || 'en';

      const response = await client.api.v1['quiz-submissions'].singleplayer.document.submit.$post({
        json: {
          documentId: Number.parseInt(documentId),
          quizTitle,
          language: quizLanguage,
          passingScore,
          userScore,
          timeTaken,
          questions,
        },
      });

      const data = (await response.json()) as QuizHistory;

      dispatch({ type: 'SUBMIT_QUIZ_SUCESS', payload: data });
    } catch (error: any) {
      toast(error.message);
      console.log(error);
    }
  };

  const getSinglePlayerSummary = async (quizId: string) => {
    try {
      const client = createApiClient();

      const response = await client.api.v1['quiz-submissions'].singleplayer[
        ':quizId'
      ].questions.$get({
        param: { quizId },
        query: { filter: 'all' },
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
        fetchDocumentQuestions,
        submitSinglePlayerQuiz,
        submitDocumentQuiz,
        getMultiplayerQuizForPlayers,
        setIsMultiplayerMode,
        isMultiplayerMode,
        getLeaderboard,
        isDocumentQuiz,
        setIsDocumentQuiz,
        getSinglePlayerSummary,
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
