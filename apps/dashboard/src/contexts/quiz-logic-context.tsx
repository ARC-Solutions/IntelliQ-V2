'use client';
import { createContext, useContext, useState, useReducer, useEffect } from 'react';
import { quizLogicReducer } from '@/utils/reducers/quiz-logic-reducer';
import { showToast } from '@/utils/show-toast';
import { useQuiz } from './quiz-context';
export interface UserAnswer {
  question: string;
  correctAnswer: string;
  userAnswer: string;
}
export interface QuizLogicValues {
  selectedAnswer: string | null;
  correctAnswer: number;
  wrongAnswer: number;
  userAnswer: UserAnswer[] | [];
}
export interface ContextValue extends QuizLogicValues {
  questionNumber: number;
  setQuestionNumber: React.Dispatch<React.SetStateAction<number>>;
  dispatch: React.Dispatch<Action>;
  progressValue: number;
  setProgressValue: React.Dispatch<React.SetStateAction<number>>;
  showCorrectAnswer: boolean;
  setShowCorrectAnswer: React.Dispatch<React.SetStateAction<boolean>>;
}
export type Action =
  | { type: 'QUIZ_FINISHED' }
  | { type: 'SET_SELECTED_ANSWER'; payload: string | null }
  | { type: 'VALIDATE_ANSWER'; payload: UserAnswer }
  | { type: 'RESET_GAME_LOGIC' }
  | { type: 'INCREMENT_QUESTION_NUMBER' }
  | { type: 'RESET_SELECTED_ANSWER' };

const initialState: QuizLogicValues = {
  selectedAnswer: null,
  correctAnswer: 0,
  wrongAnswer: 0,
  userAnswer: [],
};
const Context = createContext<ContextValue | null>(null);
const QuizLogicContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentQuiz } = useQuiz();

  const [questionNumber, setQuestionNumber] = useState(0);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [progressValue, setProgressValue] = useState<number>(
    currentQuiz ? ((questionNumber + 1) / currentQuiz.quiz.length) * 100 : 0,
  );
  const [state, dispatch] = useReducer(quizLogicReducer, initialState);
  useEffect(() => {
    if (state.correctAnswer > 0) {
      showToast('success', 'CORRECT!', "You've answered the question correctly");
    }
  }, [state.correctAnswer]);
  useEffect(() => {
    if (state.wrongAnswer > 0) {
      showToast('destructive', 'INCORRECT!', "Oops, that's not the correct answer. Keep trying!");
    }
  }, [state.wrongAnswer]);

  return (
    <Context.Provider
      value={{
        ...state,
        questionNumber,
        setQuestionNumber,
        dispatch,
        progressValue,
        setProgressValue,
        showCorrectAnswer,
        setShowCorrectAnswer,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const useQuizLogic = (): ContextValue => {
  const quizLogicContext = useContext(Context);
  if (quizLogicContext === undefined) {
    throw new Error('useQuizLogic must be used within an QuizLogicContextProvider');
  }
  return quizLogicContext as ContextValue;
};

export default QuizLogicContextProvider;
