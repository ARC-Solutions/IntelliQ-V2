import { QuizAction, QuizContextValue } from "@/contexts/quiz-context";

export const quizReducer = (
  state: QuizContextValue,
  action: QuizAction
): QuizContextValue => {
  if (action.type === "FETCH_QUIZ_REQUEST") {
    return { ...state, isLoading: true };
  } else if (action.type === "FETCH_QUIZ_SUCCESS") {
    return {
      ...state,
      isLoading: false,
      fetchingFinished: true,
      currentQuiz: action.payload,
    };
  } else if (action.type === "FETCH_QUIZ_ERROR") {
    return { ...state, isLoading: false };
  } else if (action.type === "RESET_QUIZ") {
    return {
      ...state,
      isLoading: false,
      fetchingFinished: false,
      currentQuiz: null,
    };
  } else if (action.type === "RESET_ALL") {
    return {
      isLoading: false,
      fetchingFinished: false,
      currentQuiz: null,
      summaryQuiz: null,
      quizzes: null,
    };
  } else if (action.type === "SUBMIT_QUIZ_SUCESS") {
    return {
      ...state,
      summaryQuiz: action.payload,
    };
  } else if (action.type === "STORE_QUIZZES") {
    return {
      ...state,
      quizzes: action.payload,
    };
  } else if (action.type === "FETCH_MORE_QUIZZES") {
    if (state.quizzes) {
      const newQuizzes = [...state.quizzes, ...action.payload];
      return { ...state, quizzes: newQuizzes };
    }
    return state;
  } else if (action.type === "RESET_SUMMARY_QUIZ") {
    return {
      ...state,
      summaryQuiz: null,
    };
  } else {
    return state;
  }
};
