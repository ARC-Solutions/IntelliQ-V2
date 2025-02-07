'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { createContext, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useQuiz, SupportedLanguages } from './quiz-context';
import { useQueryState, parseAsInteger, parseAsBoolean, parseAsArrayOf, parseAsString } from 'nuqs';
import * as LZString from 'lz-string';
import { QuizType } from "@intelliq/api";

const QuestionSchema = z.object({
  text: z.string().min(1, { message: 'Question text is required' }),
  options: z.array(z.string()).optional(),
  answer: z.string().optional(),
});

const QuizDataSchema = z.object({
  topic: z.string().min(1, { message: 'Topic is required' }),
  description: z.string().max(1000).optional(),
  passingScore: z.number().min(5).max(100),
  showCorrectAnswers: z.boolean(),
  tags: z.array(z.string()).optional(),
  questions: z.array(QuestionSchema),
  number: z.union([z.number(), z.string().min(1, { message: 'Number is required' })]),
  quizLanguage: z.nativeEnum(SupportedLanguages, {
    message: 'Choose a valid Language',
  }),
  quizType: z.nativeEnum(QuizType.Enum),
});

export type QuizData = z.infer<typeof QuizDataSchema>;
export type Question = z.infer<typeof QuestionSchema>;

export const languages = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pl', label: 'Polish' },
  { value: 'ro', label: 'Romanian' },
  { value: 'sr', label: 'Serbian' },
  { value: 'es', label: 'Spanish' },
  { value: 'tl', label: 'Tagalog' },
].sort((a, b) => a.label.localeCompare(b.label));
type Props = {
  children: React.ReactNode;
};

interface QuizContextValues {
  formValues: QuizData;
  errors: Record<string, any>;
  addQuestion: () => void;
  updateQuestion: (index: number, field: string, value: string | string[]) => void;
  removeQuestion: (index: number) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  onSubmit: () => void;
  register: any;
  control: any;
  resetValues: () => void;
  setTopicValue: (value: string) => void;
  setDescriptionValue: (value: string) => void;
  setNumberValue: (value: number) => void;
  setPassingScoreValue: (value: number) => void;
  setShowCorrectAnswersValue: (value: boolean) => void;
  setTagsValue: (value: string[]) => void;
  setQuizLanguageValue: (value: string) => void;
}

const initialState = {
  topic: '',
  description: '',
  passingScore: 70,
  showCorrectAnswers: true,
  tags: [],
  questions: [],
  number: '',
  quizLangauge: 'en',
  quizType: QuizType.Enum.singleplayer,
};

const QuizCreationContext = createContext<QuizContextValues | null>(null);

// 1. Create a custom hook for all nuqs state management
const useQuizQueryState = () => {
  const [topic, setTopic] = useQueryState('topic');
  const [description, setDescription] = useQueryState('description', {
    parse: (value) => {
      try {
        return LZString.decompressFromEncodedURIComponent(value) || '';
      } catch {
        return '';
      }
    },
    serialize: (value) => LZString.compressToEncodedURIComponent(value || ''),
  });
  const [number, setNumber] = useQueryState('number', parseAsInteger.withDefault(0));
  const [passingScore, setPassingScore] = useQueryState(
    'passingScore',
    parseAsInteger.withDefault(70),
  );
  const [showCorrectAnswers, setShowCorrectAnswers] = useQueryState(
    'showCorrectAnswers',
    parseAsBoolean.withDefault(true),
  );
  const [tags, setTags] = useQueryState('tags', parseAsArrayOf(parseAsString));
  const [quizLanguage, setQuizLanguage] = useQueryState('quizLanguage');
  return {
    queryState: {
      topic,
      description,
      number,
      passingScore,
      showCorrectAnswers,
      tags,
      quizLanguage,
    },
    setters: {
      setTopic,
      setDescription,
      setNumber,
      setPassingScore,
      setShowCorrectAnswers,
      setTags,
      setQuizLanguage,
    },
  };
};

// 2. Create a type for the form setters
type FormSetterFunction<T = any> = (field: keyof QuizData, value: T) => void;

// 3. Create a utility function for creating synchronized setters
const createSynchronizedSetter =
  (querySetter: (value: any) => void, formSetter: FormSetterFunction, field: keyof QuizData) =>
  (value: any) => {
    querySetter(value);
    formSetter(field, value);
  };

export const QuizCreationProvider = ({ children }: Props) => {
  const { queryState, setters } = useQuizQueryState();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<QuizData>({
    resolver: zodResolver(QuizDataSchema),
    defaultValues: {
      ...initialState,
      topic: queryState.topic!,
      description: queryState.description!,
      number: queryState.number!,
      passingScore: queryState.passingScore!,
      showCorrectAnswers: queryState.showCorrectAnswers!,
      tags: queryState.tags!,
    },
  });

  const { fetchQuestions } = useQuiz();

  const formValues = watch();

  const addQuestion = () => {
    const questions = formValues.questions || [];
    const newQuestion: Question = { text: '', options: ['', '', '', ''] };
    setValue('questions', [...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: string, value: string | string[]) => {
    const questions = [...formValues.questions];
    questions[index] = { ...questions[index], [field]: value };
    setValue('questions', questions);
  };

  const removeQuestion = (index: number) => {
    const questions = formValues.questions.filter((_, i) => i !== index);
    setValue('questions', questions);
  };

  const addTag = (tag: string) => {
    const currentTags = formValues.tags || [];
    if (tag && !currentTags.includes(tag)) {
      const newTags = [...currentTags, tag];
      setters.setTags(newTags);
      setValue('tags', newTags);
    }
  };

  const removeTag = (tag: string) => {
    const currentTags = formValues.tags || [];
    const newTags = currentTags.filter((t) => t !== tag);
    setters.setTags(newTags);
    setValue('tags', newTags);
  };

  const onSubmit = handleSubmit((data: QuizData) => {
    console.log('Quiz Data:', data);
    const questions = data.questions.map((question, index) => {
      let answerLabel;
      const options = question.options?.map((option, optionIndex) => {
        const optionLabel = String.fromCharCode(97 + optionIndex); // 97 is the ASCII code for 'a'
        const finalAnswer = `${optionLabel}) ${option}`;
        if (question.answer === option) {
          answerLabel = finalAnswer;
        }
        return finalAnswer;
      });
      return { ...question, options, answer: answerLabel };
    });
    setValue('questions', questions);

    fetchQuestions({ ...data, questions });
  });

  const resetValues = () => {
    reset(initialState);
  };

  // 4. Create synchronized setters
  const setTopicValue = createSynchronizedSetter(setters.setTopic, setValue, 'topic');
  const setQuizLanguageValue = createSynchronizedSetter(
    setters.setQuizLanguage,
    setValue,
    'quizLanguage',
  );
  const setDescriptionValue = createSynchronizedSetter(
    setters.setDescription,
    setValue,
    'description',
  );
  const setNumberValue = createSynchronizedSetter(setters.setNumber, setValue, 'number');
  const setPassingScoreValue = createSynchronizedSetter(
    setters.setPassingScore,
    setValue,
    'passingScore',
  );
  const setShowCorrectAnswersValue = createSynchronizedSetter(
    setters.setShowCorrectAnswers,
    setValue,
    'showCorrectAnswers',
  );
  const setTagsValue = createSynchronizedSetter(setters.setTags, setValue, 'tags');

  return (
    <QuizCreationContext.Provider
      value={{
        formValues,
        errors,
        addQuestion,
        updateQuestion,
        removeQuestion,
        addTag,
        removeTag,
        onSubmit,
        register,
        control,
        resetValues,
        // nuqs
        setTopicValue,
        setDescriptionValue,
        setNumberValue,
        setPassingScoreValue,
        setShowCorrectAnswersValue,
        setTagsValue,
        setQuizLanguageValue,
      }}
    >
      {children}
    </QuizCreationContext.Provider>
  );
};

export const useQuizCreation = (): QuizContextValues => {
  const context = useContext(QuizCreationContext);
  if (context === null) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
