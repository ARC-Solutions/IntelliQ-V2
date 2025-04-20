'use client';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import Lottie from 'lottie-react';
import Loading from '@/assets/loading.json';
import LoadingDark from '@/assets/loading-dark.json';
import { useTheme } from 'next-themes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { languages } from '@/contexts/quiz-creation-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BookOpen, HelpCircle, Plus, Trash2, Tag, Hash } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuizCreation } from '@/contexts/quiz-creation-context';
import type { Question } from '@/contexts/quiz-creation-context';
import { useQuiz } from '@/contexts/quiz-context';
import { redirect } from 'next/navigation';
import { useQueryState } from 'nuqs';
import NumberFlow from '@number-flow/react';

export default function QuizCreator() {
  const {
    formValues,
    onSubmit,
    addQuestion,
    addTag,
    updateQuestion,
    removeQuestion,
    removeTag,
    register,
    errors,
    control,
    setTopicValue,
    setDescriptionValue,
    setNumberValue,
    setPassingScoreValue,
    setShowCorrectAnswersValue,
    setQuizLanguageValue,
  } = useQuizCreation();
  const { isLoading, fetchingFinished, currentQuiz, isMultiplayerMode } = useQuiz();
  const { resolvedTheme } = useTheme();
  // UI nuqs
  const [activeTab, setActiveTab] = useQueryState("activeTab", {
    defaultValue: "general",
  });

  // all other nuqs related logic happens in src/contexts/quiz-creation-context.tsx
  const [newTag, setNewTag] = useState("");

  if (fetchingFinished && currentQuiz) {
    if (isMultiplayerMode) {
      // Don't redirect if in multiplayer mode
      return null;
    }
    redirect('/single-player/quiz/play');
  }
  if (isLoading) {
    return (
      <div className="absolute left-1/2 top-1/2 flex w-[40] -translate-x-1/2 -translate-y-1/2 flex-col items-center md:w-[30vw]">
        <Lottie animationData={resolvedTheme === "dark" ? LoadingDark : Loading} />
      </div>
    );
  }

  return (
    <div className="container flex flex-col justify-start p-6 mx-auto">
      <h1 className="mb-6 text-3xl font-bold">Create Your Quiz</h1>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General Info</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">Quiz Topic</Label>
              <div className="relative">
                <BookOpen
                  className="absolute text-gray-500 transform -translate-y-1/2 left-3 top-1/2"
                  size={18}
                />
                <Input
                  id="topic"
                  {...register("topic")}
                  onChange={(e) => setTopicValue(e.target.value)}
                  value={formValues.topic || ""}
                  placeholder="Enter the main subject or theme of your quiz"
                  className="pl-10"
                />
                {errors.topic && (
                  <p className="text-red-500">{errors.topic.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Quiz Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Provide a brief overview of what the quiz covers"
                onChange={(e) => setDescriptionValue(e.target.value)}
                value={formValues.description || ""}
                rows={4}
              />
              {errors.description && (
                <p className="text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Number of Questions</Label>
              <div className="relative">
                <Hash
                  className="absolute text-gray-500 transform -translate-y-1/2 left-3 top-1/2"
                  size={18}
                />
                <Input
                  type='number'
                  id='number'
                  {...register('number')}
                  onChange={(e) => setNumberValue(Number.parseInt(e.target.value))}
                  value={formValues.number || ''}
                  placeholder='How many AI-generated questions?'
                  className='pl-10'
                  required
                />
                {errors.number && (
                  <p className="text-red-500">{errors.number.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passingScore">Passing Score (%)</Label>
              <Controller
                name="passingScore"
                control={control}
                render={() => (
                  <Slider
                    id="passingScore"
                    min={0} // Keep visual minimum at 0
                    max={100}
                    step={5}
                    onValueChange={(value) =>
                      setPassingScoreValue(Math.max(5, value[0]))
                    } // Enforce minimum of 5
                    value={[
                      formValues.passingScore < 5 ? 0 : formValues.passingScore,
                    ]} // Show 0 if below 5
                    className="flex-grow"
                  />
                )}
              />
              <NumberFlow
                value={Math.max(5, formValues.passingScore || 5)}
                suffix="%"
                className="font-medium text-right"
              />
              {errors.passingScore && (
                <p className="text-red-500">{errors.passingScore.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="showCorrectAnswers"
                  className="flex items-center space-x-2"
                >
                  <span>Show Correct Answers</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle size={16} className="text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Display correct answers between questions</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Controller
                  name="showCorrectAnswers"
                  control={control}
                  render={() => (
                    <Switch
                      id="showCorrectAnswers"
                      checked={formValues.showCorrectAnswers}
                      onCheckedChange={(e) => setShowCorrectAnswersValue(e)}
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex">
                <Label
                  htmlFor="quizLanguage"
                  className="flex items-center space-x-2"
                >
                  <span>Language</span>
                  <Controller
                    name="quizLanguage"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setQuizLanguageValue(value);
                        }}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full border-gray-800 dark:bg-black">
                          <SelectValue placeholder='Select Language' />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Quiz Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formValues.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    className="flex items-center px-2 py-1 text-sm text-blue-800 bg-blue-100 rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  id="newTag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter a tag"
                  className="flex-grow"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (newTag.trim()) {
                      addTag(newTag.trim());
                      setNewTag("");
                    }
                  }}
                  size="sm"
                >
                  <Tag size={16} className="mr-2" /> Add Tag
                </Button>
                
              </div>
              {errors.tags && (
                <p className="text-red-500">At least one tag is required</p>
              )}
            </div>

            <Button type="submit">Create Quiz</Button>
          </form>
        </TabsContent>

        <TabsContent value="questions">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Questions</h2>
              <Button onClick={addQuestion}>
                <Plus size={16} className="mr-2" /> Add Question
              </Button>
            </div>
            {formValues.questions.length > 0 ? (
              <ScrollArea className="h-[500px] w-full">
                <div className="flex flex-col gap-4">
                  {formValues.questions.map(
                    (question: Question, index: number) => (
                      <div
                        key={index}
                        className="p-4 space-y-4 border rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`question-${index}`}>
                            Question {index + 1}
                          </Label>
                          <Button
                            onClick={() => removeQuestion(index)}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                        <Textarea
                          id={`question-${index}`}
                          value={question.text}
                          onChange={(e) =>
                            updateQuestion(index, "text", e.target.value)
                          }
                          placeholder="Enter your question"
                          rows={3}
                        />

                        <div className="space-y-2">
                          {question.options?.map((option, optionIndex) => {
                            return (
                              <div
                                key={optionIndex}
                                className="flex items-center space-x-2"
                              >
                                <Input
                                  value={option}
                                  onChange={(e) =>
                                    updateQuestion(index, "options", [
                                      ...question.options!.slice(
                                        0,
                                        optionIndex
                                      ),
                                      e.target.value,
                                      ...question.options!.slice(
                                        optionIndex + 1
                                      ),
                                    ])
                                  }
                                  placeholder={"value"}
                                />
                                <RadioGroup
                                  onValueChange={(value) =>
                                    updateQuestion(index, "answer", value)
                                  }
                                  value={question.answer}
                                >
                                  <RadioGroupItem
                                    value={option}
                                    id={`question-${index}-option-${optionIndex}`}
                                  />
                                </RadioGroup>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </ScrollArea>
            ) : (
              <p>No questions available. Add your own questions (Optional).</p>
            )}
            <div className="flex justify-between">
              <Button onClick={() => setActiveTab("general")} variant="outline">
                Back to General Info
              </Button>
              <Button onClick={() => setActiveTab("preview")}>
                Preview Quiz
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="preview">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Quiz Preview</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Topic:</h3>
                <p>{formValues.topic}</p>
              </div>
              <div>
                <h3 className="font-semibold">Description:</h3>
                <p>{formValues.description}</p>
              </div>
              <div>
                <h3 className="font-semibold">Passing Score:</h3>
                <p>{formValues.passingScore}%</p>
              </div>
              <div>
                <h3 className="font-semibold">Settings:</h3>
                <ul className="list-disc list-inside">
                  <li>
                    Show Correct Answers:{" "}
                    {formValues.showCorrectAnswers ? "Yes" : "No"}
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {formValues.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-sm text-blue-800 bg-blue-100 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Questions:</h3>
                {formValues.questions.length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <ol className="space-y-4 list-decimal list-inside">
                      {formValues.questions.map((question, index) => (
                        <li key={index} className="p-4 border rounded-lg">
                          <p className="font-medium">{question.text}</p>

                          <ul className="mt-2 ml-4 list-disc list-inside">
                            {question.options?.map((option, optionIndex) => (
                              <li
                                key={optionIndex}
                                className={
                                  option === question.answer ? "font-bold" : ""
                                }
                              >
                                {option}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ol>
                  </ScrollArea>
                ) : (
                  <p>
                    No questions available. Add your own questions (Optional).
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <Button
                onClick={() => setActiveTab("questions")}
                variant="outline"
              >
                Back to Questions
              </Button>
              <Button onClick={onSubmit}>Create Quiz</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
