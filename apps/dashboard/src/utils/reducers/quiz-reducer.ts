import type { QuizAction, QuizContextValue } from '@/contexts/quiz-context';

export const quizReducer = (state: QuizContextValue, action: QuizAction): QuizContextValue => {
  if (action.type === 'FETCH_QUIZ_REQUEST') {
    return { ...state, isLoading: true };
  }

  if (action.type === 'FETCH_QUIZ_SUCCESS') {
    return {
      ...state,
      isLoading: false,
      fetchingFinished: true,
      currentQuiz: action.payload,
      summaryQuiz: null,
    };
  }

  if (action.type === 'FETCH_QUIZ_ERROR') {
    return { ...state, isLoading: false };
  }

  if (action.type === 'RESET_QUIZ') {
    return {
      ...state,
      isLoading: false,
      fetchingFinished: false,
      currentQuiz: null,
      leaderboard: null,
    };
  }

  if (action.type === 'RESET_ALL') {
    return {
      isLoading: false,
      fetchingFinished: false,
      currentQuiz: null,
      summaryQuiz: null,
      quizzes: null,
      leaderboard: null,
    };
  }

  if (action.type === 'SUBMIT_QUIZ_SUCESS') {
    return {
      ...state,
      summaryQuiz: action.payload,
    };
  }

  if (action.type === 'STORE_QUIZZES') {
    return {
      ...state,
      quizzes: action.payload,
    };
  }

  if (action.type === 'FETCH_MORE_QUIZZES') {
    if (state.quizzes) {
      const newQuizzes = [...state.quizzes, ...action.payload];
      return { ...state, quizzes: newQuizzes };
    }
    return state;
  }

  if (action.type === 'FETCH_LEADERBOARD_SUCCESS') {
    return {
      ...state,
      leaderboard: action.payload,
    };
  }

  return state;
};
