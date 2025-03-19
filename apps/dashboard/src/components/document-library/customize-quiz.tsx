"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { SupportedLanguages, useQuiz } from "@/contexts/quiz-context";
import { languages, useQuizCreation } from "@/contexts/quiz-creation-context";
import { useQuizLogic } from "@/contexts/quiz-logic-context";
import { createApiClient } from "@/utils/api-client";
import NumberFlow from "@number-flow/react";
import Lottie from "lottie-react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "../../../public/Loading.json";

export function CustomizeQuiz({ documentId }: { documentId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { fetchDocumentQuestions } = useQuiz();
  const { dispatch: quizLogicDispatch } = useQuizLogic();
  const {
    setNumberValue,
    setQuizLanguageValue,
    setShowCorrectAnswersValue,
    setPassingScoreValue,
  } = useQuizCreation();

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [document, setDocument] = useState<any>(null);
  const [quizSettings, setQuizSettings] = useState({
    questionCount: 5,
    passingScore: 70,
    showCorrectAnswers: true,
    quizLanguage: "en",
  });

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setIsLoading(true);
        const client = createApiClient();
        const response = await client.api.v1.documents[documentId].$get();

        if (!response.ok) {
          throw new Error("Document not found");
        }

        const doc = await response.json();
        if (doc.processingStatus !== "completed") {
          toast({
            title: "Document not ready",
            description:
              "This document is still being processed. Please wait until processing is complete.",
            variant: "destructive",
          });
          router.push("/documents");
          return;
        }

        setDocument(doc);
      } catch (error) {
        console.error("Error fetching document:", error);
        setIsError(true);
        toast({
          title: "Error",
          description: "Failed to load document information.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, router, toast]);

  const handleStartQuiz = async () => {
    try {
      setIsGenerating(true);

      // Update quiz creation context values
      setNumberValue(quizSettings.questionCount);
      setQuizLanguageValue(quizSettings.quizLanguage);
      setShowCorrectAnswersValue(quizSettings.showCorrectAnswers);
      setPassingScoreValue(quizSettings.passingScore);

      // Reset quiz logic state
      quizLogicDispatch({ type: "RESET_GAME_LOGIC" });

      // Generate quiz from document
      await fetchDocumentQuestions({
        documentId,
        number: quizSettings.questionCount,
        quizLanguage: quizSettings.quizLanguage as SupportedLanguages,
        showCorrectAnswers: quizSettings.showCorrectAnswers,
        passingScore: quizSettings.passingScore,
        quizType: "document",
        questions: [],
        topic: document.title || "Document Quiz",
        description: document.description || "Quiz generated from document",
        tags: ["document"],
      });

      // Redirect to the quiz PLAY page
      router.push("/single-player/quiz/play");
    } catch (error) {
      console.error("Error preparing document quiz:", error);
      toast({
        title: "Error",
        description: "Failed to prepare quiz from document.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="absolute left-1/2 top-1/2 flex w-[40] -translate-x-1/2 -translate-y-1/2 flex-col items-center md:w-[30vw]">
        <Lottie animationData={Loading} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen py-8">
        <div className="w-full max-w-3xl px-4">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Document Not Found</CardTitle>
              <CardDescription>
                The document you're looking for doesn't exist or has been
                deleted.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button
                variant="default"
                onClick={() => router.push("/documents")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Documents
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // Show skeleton loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen py-8">
        <div className="w-full max-w-3xl px-4">
          <div className="mb-4">
            <Skeleton className="h-10 w-40" />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-16 rounded-md" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-5 w-64" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-5 rounded-sm" />
                <Skeleton className="h-5 w-64" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-11 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen py-8">
      <div className="w-full max-w-3xl px-4">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push("/documents")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documents
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Customize Quiz</CardTitle>
            <CardDescription>Configure your quiz settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="questionCount">Number of Questions</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  id="questionCount"
                  min={1}
                  max={10}
                  step={1}
                  value={[quizSettings.questionCount]}
                  onValueChange={(value) =>
                    setQuizSettings({
                      ...quizSettings,
                      questionCount: value[0],
                    })
                  }
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium">
                  <NumberFlow
                    value={quizSettings.questionCount}
                    format={{ useGrouping: false }}
                    willChange
                  />
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passingScore">Passing Score (%)</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  id="passingScore"
                  min={5}
                  max={100}
                  step={5}
                  value={[quizSettings.passingScore]}
                  onValueChange={(value) =>
                    setQuizSettings({
                      ...quizSettings,
                      passingScore: value[0],
                    })
                  }
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium">
                  <NumberFlow
                    value={quizSettings.passingScore}
                    format={{ useGrouping: false }}
                    willChange
                  />
                  %
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quizLanguage">Quiz Language</Label>
              <Select
                value={quizSettings.quizLanguage}
                onValueChange={(value) =>
                  setQuizSettings({ ...quizSettings, quizLanguage: value })
                }
              >
                <SelectTrigger id="quizLanguage">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="showCorrectAnswers"
                checked={quizSettings.showCorrectAnswers}
                onCheckedChange={(checked) =>
                  setQuizSettings({
                    ...quizSettings,
                    showCorrectAnswers: checked,
                  })
                }
              />
              <Label htmlFor="showCorrectAnswers">
                Show correct answers after each question
              </Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              size="lg"
              onClick={handleStartQuiz}
              disabled={isGenerating}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Start Quiz
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
