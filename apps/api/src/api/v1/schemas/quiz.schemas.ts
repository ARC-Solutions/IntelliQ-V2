import { z } from 'zod';
import { quizType, supportedLanguages } from './common.schemas';

export const OPTION_PREFIXES = ['a) ', 'b) ', 'c) ', 'd) '] as const;

export const quizSchema = z.object({
  quizTitle: z.string(),
  questions: z.array(
    z.object({
      questionTitle: z.string().describe('A brief title for the question'),
      text: z.string().describe('The actual question text'),
      options: z
        .array(z.string())
        .describe(
          `An array of 4 quiz options. Each option MUST use the exact prefix format: ${JSON.stringify(
            OPTION_PREFIXES,
          )} followed by the option text.`,
        ),
      correctAnswer: z.string().describe('The correct answer text'),
    }),
  ),
});

export const documentsQuizSchema = z.object({
  quizDescription: z.string().describe('The description of the quiz'),
  quizTopic: z.string().describe('The topic of the quiz'),
  quizTitle: z.string().describe('The title of the quiz'),
  questions: z.array(
    z.object({
      questionTitle: z.string().describe('A brief title for the question'),
      text: z.string().describe('The actual question text'),
      options: z
        .array(z.string())
        .describe(
          `An array of 4 quiz options. Each option MUST use the exact prefix format: ${JSON.stringify(
            OPTION_PREFIXES,
          )} followed by the option text.`,
        ),
      correctAnswer: z.string().describe('The correct answer text'),
    }),
  ),
});

export const quizGenerationRequestSchema = z.object({
  quizTopic: z.string().min(1, 'Quiz topic is required'),
  quizDescription: z.string().min(1, 'Quiz description is required').optional(),
  numberOfQuestions: z.coerce
    .number()
    .int()
    .min(1, 'Must generate at least 1 question')
    .max(10, 'Cannot generate more than 10 questions'),
  quizTags: z
    .preprocess(
      (val) => (typeof val === 'string' ? val.split(',').map((tag) => tag.trim()) : val),
      z.array(z.string()),
    )
    .optional(),
  language: supportedLanguages.default(supportedLanguages.Enum.en),
  quizType: z.enum(['singleplayer', 'multiplayer', 'document', 'random']),
});

export const quizResponseSchema = z.object({
  quiz: quizSchema,
});

export const quizSubmissionMultiplayerRequestSchema = z.object({
  quizTitle: z.string(),
  quizTopics: z.array(z.string()),
  language: supportedLanguages,
  questions: z.array(
    z.object({
      questionTitle: z.string(),
      text: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.string(),
    }),
  ),
});

export const quizSubmissionMultiplayerResponseSchema = z.object({
  quizId: z.string().uuid(),
  questions: z.array(
    z.object({
      questionTitle: z.string(),
      id: z.string().uuid(),
      text: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.string(),
    }),
  ),
});

// export const quizSubmissionMultiplayerRequestSchema = z.object({
//   quizTitle: z.string(),
//   type: quizType,
//   language: supportedLanguages,
//   documentId: z.string().uuid(),
//   passingScore: z.number().positive(),
//   userScore: z.number().positive(),
//   totalCount: z.number().positive(),
//   topics: z.array(z.string()),
//   description: z.string(),
//   questions: z.array(
//     z.object({
//       text: z.string(),
//       userAnswer: z.string(),
//       correctAnswer: z.string(),
//       timeTaken: z.number().positive(),
//       options: z.array(z.string()),
//     })
//   ),
// });

// Schema for POST /:roomId/submissions response
export const quizSubmissionMultiplayerSubmitResponseSchema = z.object({
  success: z.boolean(),
  submission: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    quizId: z.string().uuid(),
    roomId: z.string().uuid(),
    userScore: z.number(),
    correctAnswersCount: z.number(),
    createdAt: z.string(),
  }),
  correctAnswer: z.string(),
  calculatedScore: z.number(),
  totalQuestions: z.number(),
});

// Schema for single player quiz submission question
const singlePlayerQuizSubmissionQuestionSchema = z.object({
  text: z.string(),
  correctAnswer: z.string(),
  userAnswer: z.string(),
  options: z.array(z.string()),
});
// Schema for GET /:roomId/leaderboard response
export const quizLeaderboardResponseSchema = z.object({
  leaderboard: z.array(
    z.object({
      userName: z.string(),
      userId: z.string().uuid(),
      score: z.number(),
      correctAnswers: z.number(),
      avgTimeTaken: z.number(),
      totalQuestions: z.number(),
      questions: z.array(
        z.object({
          text: z.string(),
          correctAnswer: z.string(),
          userAnswer: z.string(),
          timeTaken: z.number(),
        }),
      ),
    }),
  ),
});

export const quizSubmissionAnswerSchema = z.object({
  questionId: z.string().uuid(),
  userAnswer: z.string(),
  timeTaken: z.number().optional(),
});

export const quizSubmissionRequestSchema = z.object({
  answers: quizSubmissionAnswerSchema,
});

export const quizQuestionResponseSchema = z.object({
  id: z.string().uuid(),
  questionTitle: z.string(),
  text: z.string(),
  options: z.array(z.string()),
});

export const quizQuestionsResponseSchema = z.object({
  quizId: z.string().uuid(),
  quizTitle: z.string(),
  questions: z.array(quizQuestionResponseSchema),
});

// Schema for single player quiz submission request
export const singlePlayerQuizSubmissionRequestSchema = z.object({
  quizTitle: z.string(),
  description: z.string(),
  topic: z.array(z.string()),
  tags: z.array(z.string()),
  passingScore: z.number(),
  language: z.string(),
  userScore: z.number(),
  questions: z.array(singlePlayerQuizSubmissionQuestionSchema),
  timeTaken: z.number(),
});

// Schema for single player quiz submission response question
const singlePlayerQuizSubmissionResponseQuestionSchema = z.object({
  text: z.string(),
  correctAnswer: z.string(),
  userAnswer: z.string(),
});

// Schema for single player quiz submission response
export const singlePlayerQuizSubmissionResponseSchema = z.object({
  quizId: z.string().uuid(),
  quizTitle: z.string(),
  quizScore: z.number(),
  totalTime: z.number(),
  correctAnswersCount: z.number(),
  totalQuestions: z.number(),
  questions: z.array(singlePlayerQuizSubmissionResponseQuestionSchema),
  passingScore: z.number(),
});

// Schema for filtered quiz question response
const filteredQuizQuestionSchema = z.object({
  text: z.string(),
  correctAnswer: z.string(),
  userAnswer: z.string(),
});

// Schema for filtered quiz response
export const filteredQuizResponseSchema = z.object({
  quizId: z.string().uuid(),
  quizTitle: z.string(),
  quizScore: z.number(),
  totalTime: z.number(),
  correctAnswersCount: z.number(),
  totalQuestions: z.number(),
  questions: z.array(filteredQuizQuestionSchema),
  passingScore: z.number(),
});

// Query parameter schema for filtering
export const filterQuerySchema = z.object({
  filter: z.enum(['all', 'correct', 'incorrect']).default('all'),
});

export const documentQuizSchema = z.object({
  documentId: z.coerce.number(),
  numberOfQuestions: z.coerce.number().min(1).max(10),
  quizType: quizType.default(quizType.Enum.document),
  language: supportedLanguages.default(supportedLanguages.Enum.en),
});

export type Quiz = {
  id: string;
  title: string;
  topic: string[];
  description: string | null;
  tags: string[] | null;
  type: 'singleplayer' | 'multiplayer' | 'document' | 'random';
  language: string;
  userId: string;
  roomId: string | null;
  questionsCount: number;
  questions: { text: string }[];
  room?: {
    multiplayerQuizSubmissions: {
      user: {
        id: string;
      };
    }[];
  };
};

// Schema for document quiz submission request
export const documentQuizSubmissionRequestSchema = z.object({
  documentId: z.coerce.number(),
  quizTitle: z.string(),
  language: z.string(),
  passingScore: z.number(),
  userScore: z.number(),
  questions: z.array(singlePlayerQuizSubmissionQuestionSchema),
  timeTaken: z.number(),
});
