"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { createContext, useContext } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuiz } from "./quiz-context";
import {
  useQueryState,
  parseAsInteger,
  parseAsBoolean,
  parseAsArrayOf,
  parseAsString,
} from "nuqs";

const QuestionSchema = z.object({
  text: z.string().min(1, { message: "Question text is required" }),
  options: z.array(z.string()).optional(),
  answer: z.string().optional(),
});

const QuizDataSchema = z.object({
  topic: z.string().min(1, { message: "Topic is required" }),
  description: z.string().optional(),
  passingScore: z.number().min(0).max(100),
  showCorrectAnswers: z.boolean(),
  tags: z.array(z.string()).optional(),
  questions: z.array(QuestionSchema),
  number: z.union([
    z.number(),
    z.string().min(1, { message: "Number is required" }),
  ]),
});

export type QuizData = z.infer<typeof QuizDataSchema>;
export type Question = z.infer<typeof QuestionSchema>;

type Props = {
  children: React.ReactNode;
};

interface QuizContextValues {
  formValues: QuizData;
  errors: Record<string, any>;
  addQuestion: () => void;
  updateQuestion: (
    index: number,
    field: string,
    value: string | string[]
  ) => void;
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
}

const initialState = {
  topic: "",
  description: "",
  passingScore: 70,
  showCorrectAnswers: true,
  tags: [],
  questions: [],
  number: "",
};

const QuizCreationContext = createContext<QuizContextValues | null>(null);

export const QuizCreationProvider = ({ children }: Props) => {
  // nuqs handling
  const [topic, setTopic] = useQueryState("topic");
  const [description, setDescription] = useQueryState("description");
  const [number, setNumber] = useQueryState(
    "number",
    parseAsInteger.withDefault(0)
  );
  const [passingScore, setPassingScore] = useQueryState(
    "passingScore",
    parseAsInteger.withDefault(70)
  );
  const [showCorrectAnswers, setShowCorrectAnswers] = useQueryState(
    "showCorrectAnswers",
    parseAsBoolean.withDefault(true)
  );
  const [tags, setTags] = useQueryState("tags", parseAsArrayOf(parseAsString));
  const setTopicValue = (value: string) => {
    setTopic(value);
    setValue("topic", value);
  };
  const setDescriptionValue = (value: string) => {
    setDescription(value);
    setValue("description", value);
  };
  const setNumberValue = (value: number) => {
    setNumber(value);
    setValue("number", value);
  };
  const setPassingScoreValue = (value: number) => {
    setPassingScore(value);
    setValue("passingScore", value);
  };
  const setShowCorrectAnswersValue = (value: boolean) => {
    setShowCorrectAnswers(value);
    setValue("showCorrectAnswers", value);
  };
  const setTagsValue = (value: string[]) => {
    setTags(value);
    setValue("tags", value);
  };

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
      topic: topic!,
      description: description!,
      number: number!,
      passingScore: passingScore!,
      showCorrectAnswers: showCorrectAnswers!,
      tags: tags!,
    },
  });

  const { fetchQuestions } = useQuiz();

  const formValues = watch();

  const addQuestion = () => {
    const questions = formValues.questions || [];
    const newQuestion: Question = { text: "", options: ["", "", "", ""] };
    setValue("questions", [...questions, newQuestion]);
  };

  const updateQuestion = (
    index: number,
    field: string,
    value: string | string[]
  ) => {
    const questions = [...formValues.questions];
    questions[index] = { ...questions[index], [field]: value };
    setValue("questions", questions);
  };

  const removeQuestion = (index: number) => {
    const questions = formValues.questions.filter((_, i) => i !== index);
    setValue("questions", questions);
  };

  const addTag = (tag: string) => {
    const currentTags = formValues.tags || [];
    if (tag && !currentTags.includes(tag)) {
      setTagsValue([...currentTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    const currentTags = formValues.tags || [];
    setTagsValue(currentTags.filter((t) => t !== tag));
  };

  const onSubmit = handleSubmit((data: QuizData) => {
    console.log("Quiz Data:", data);
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
    setValue("questions", questions);

    fetchQuestions({ ...data, questions });
  });

  const resetValues = () => {
    reset(initialState);
  };

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
      }}
    >
      {children}
    </QuizCreationContext.Provider>
  );
};

export const useQuizCreation = (): QuizContextValues => {
  const context = useContext(QuizCreationContext);
  if (context === null) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
};
