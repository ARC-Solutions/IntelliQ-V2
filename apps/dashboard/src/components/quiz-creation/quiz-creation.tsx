"use client";
import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import Lottie from "lottie-react";
import Loading from "../../../public/Loading.json";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookOpen, HelpCircle, Plus, Trash2, Tag, Hash } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuizCreation, Question } from "@/contexts/quiz-creation-context";
import { useQuiz } from "@/contexts/quiz-context";
import { redirect } from "next/navigation";
import {
  useQueryState,
  parseAsInteger,
  parseAsBoolean,
  parseAsArrayOf,
  parseAsString,
} from "nuqs";

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
    resetValues,
  } = useQuizCreation();
  const { isLoading, fetchingFinished, currentQuiz } = useQuiz();

  // replace useState with useQueryState for persistent UI state
  const [activeTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "general",
  });

  // URL state for quiz configuration
  const [topic, setTopic] = useQueryState("topic");
  const [description, setDescription] = useQueryState("description");
  const [questionCount, setQuestionCount] = useQueryState(
    "count",
    parseAsInteger
  );
  const [passingScore, setPassingScore] = useQueryState(
    "passing",
    parseAsInteger.withDefault(70)
  );
  const [showAnswers, setShowAnswers] = useQueryState(
    "showAnswers",
    parseAsBoolean.withDefault(true)
  );
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useQueryState("tags", parseAsArrayOf(parseAsString));

  if (fetchingFinished && currentQuiz) {
    redirect("/single-player/quiz/play");
  }
  if (isLoading) {
    return (
      <div className="absolute left-1/2 top-1/2 flex w-[40] -translate-x-1/2 -translate-y-1/2 flex-col items-center md:w-[30vw]">
        <Lottie animationData={Loading} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 flex flex-col justify-start">
      <h1 className="text-3xl font-bold mb-6">Create Your Quiz</h1>
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
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={18}
                />
                <Input
                  id="topic"
                  // Spread all of the register props (name, ref, onBlur, etc.)
                  {...register("topic")}
                  value={topic || ""}
                  onChange={(e) => {
                    // Let RHF do its thing
                    register("topic").onChange(e);

                    // Then update your URL param state
                    setTopic(e.target.value);
                  }}
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
                value={description || ""}
                onChange={(e) => {
                  register("description").onChange(e);
                  setDescription(e.target.value);
                }}
                placeholder="Provide a brief overview"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Number of Questions</Label>
              <div className="relative">
                <Hash
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={18}
                />
                <Input
                  type="number"
                  id="number"
                  {...register("number")} // <-- This ensures RHF sees the field
                  value={questionCount || ""}
                  onChange={(e) => {
                    register("number").onChange(e);
                    setQuestionCount(
                      e.target.value ? parseInt(e.target.value) : 0
                    );
                  }}
                  placeholder="How many questions?"
                  className="pl-10"
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
                render={({ field }) => (
                  <Slider
                    id="passingScore"
                    min={0}
                    max={100}
                    step={5}
                    value={[passingScore || 70]}
                    onValueChange={(value) => {
                      setPassingScore(value[0]);
                      field.onChange(value[0]);
                    }}
                    className="flex-grow"
                  />
                )}
              />
              <p className="font-medium w-16 text-right">{passingScore}%</p>
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
                <Switch
                  id="showCorrectAnswers"
                  {...register("showCorrectAnswers")}
                  checked={showAnswers || false}
                  onCheckedChange={(checked) => {
                    register("showCorrectAnswers").onChange({
                      target: { name: "showCorrectAnswers", value: checked },
                    });
                    setShowAnswers(checked);
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Quiz Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags?.map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        removeTag(tag);
                        const updatedTags = tags.filter((t) => t !== tag);
                        setTags(updatedTags.length > 0 ? updatedTags : null);
                      }}
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
                  {...register("newTag")}
                  value={newTag || ""}
                  onChange={(e) => {
                    register("newTag").onChange(e);
                    setNewTag(e.target.value);
                  }}
                  placeholder="Enter a tag"
                  className="flex-grow"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (newTag.trim()) {
                      addTag(newTag.trim());
                      setNewTag("");
                      const updatedTags = [...(tags || []), newTag.trim()];
                      setTags(updatedTags);
                    }
                  }}
                  size="sm"
                >
                  <Tag size={16} className="mr-2" /> Add Tag
                </Button>
              </div>
            </div>

            <Button type="submit">Create Quiz</Button>
          </form>
        </TabsContent>

        <TabsContent value="questions">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
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
                        className="border p-4 rounded-lg space-y-4"
                      >
                        <div className="flex justify-between items-center">
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
                  {tags?.map((tag) => (
                    <span
                      key={tag}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
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
                    <ol className="list-decimal list-inside space-y-4">
                      {formValues.questions.map((question, index) => (
                        <li key={index} className="border p-4 rounded-lg">
                          <p className="font-medium">{question.text}</p>

                          <ul className="list-disc list-inside ml-4 mt-2">
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
