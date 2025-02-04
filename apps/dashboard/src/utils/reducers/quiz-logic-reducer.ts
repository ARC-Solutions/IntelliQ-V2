import { QuizLogicValues, Action } from '@/contexts/quiz-logic-context';

export const quizLogicReducer = (state: QuizLogicValues, action: Action) => {
  if (action.type === 'SET_SELECTED_ANSWER') {
    return { ...state, selectedAnswer: action.payload };
  } else if (action.type === 'VALIDATE_ANSWER') {
    const { correctAnswer, userAnswer, question } = action.payload;
    let scoreCORRECT = state.correctAnswer;
    let scoreINCORRECT = state.wrongAnswer;
    if (userAnswer !== correctAnswer) {
      scoreINCORRECT += 1;
    } else {
      scoreCORRECT += 1;
    }
    return {
      ...state,
      correctAnswer: scoreCORRECT,
      wrongAnswer: scoreINCORRECT,
      userAnswer: [
        ...state.userAnswer,
        {
          question,
          correctAnswer,
          userAnswer,
        },
      ],
    };
  } else if (action.type === 'RESET_GAME_LOGIC') {
    return {
      quizFinished: false,
      selectedAnswer: null,
      correctAnswer: 0,
      wrongAnswer: 0,
      userAnswer: [],
    };
  } else if (action.type === 'RESET_SELECTED_ANSWER') {
    return {
      ...state,
      selectedAnswer: null,
    };
  } else {
    return state;
  }
};
