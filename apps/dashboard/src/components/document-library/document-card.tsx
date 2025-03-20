"use client";

import { useState } from "react";
import {
  FileText,
  Clock,
  ArrowUpRight,
  Trash2,
  Loader2,
  Settings,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

interface Document {
  id: string;
  title: string;
  type: string;
  uploadDate: string;
  size: string;
  quizCount: number;
  processingStatus?:
    | "failed"
    | "completed"
    | "chunking"
    | "embedding"
    | "extracting_text"
    | "pending";
}

interface DocumentCardProps {
  document: Document;
  onQuiz: () => void;
  onDelete: (id: string) => void;
}

export function DocumentCard({
  document,
  onQuiz,
  onDelete,
}: DocumentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  // Format the date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const handleDelete = () => {
    onDelete(document.id);
    setShowDeleteDialog(false);
  };

  // Determine if the document is ready for quiz
  const isQuizReady =
    !document.processingStatus || document.processingStatus === "completed";

  // Add handleCustomizeQuiz function
  const handleCustomizeQuiz = () => {
    router.push(`/documents/customize-quiz/${document.id}`);
  };

  // Get the processing status text and variant for the button
  const getProcessingButton = () => {
    if (
      !document.processingStatus ||
      document.processingStatus === "completed"
    ) {
      return {
        text: (
          <>
            Start Quiz
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </>
        ),
        variant: "default",
        disabled: false,
      };
    }

    if (document.processingStatus === "failed") {
      return {
        text: "Failed",
        variant: "destructive",
        disabled: true,
        className:
          "bg-destructive text-destructive-foreground dark:bg-red-700 dark:text-white hover:bg-destructive/90 dark:hover:bg-red-800",
      };
    }

    const statusText = {
      pending: "Processing",
      extracting_text: "Extracting Text",
      chunking: "Chunking",
      embedding: "Embedding",
    };

    return {
      text: (
        <>
          {statusText[document.processingStatus]}
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        </>
      ),
      variant: "outline",
      disabled: true,
      className:
        "bg-muted text-muted-foreground dark:bg-zinc-800 dark:text-zinc-300 cursor-not-allowed",
    };
  };

  const buttonConfig = getProcessingButton();

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md bg-card text-card-foreground">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold line-clamp-1">
            {document.title}
          </CardTitle>
          <Badge variant="outline" className="bg-card text-card-foreground">
            {document.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <FileText className="mr-1 h-4 w-4" />
          <span>{document.size}</span>
          <span className="mx-2">•</span>
          <Clock className="mr-1 h-4 w-4" />
          <span>{formatDate(document.uploadDate)}</span>
        </div>
        <div className="mt-2 text-sm">
          {document.quizCount > 0 ? (
            <span>
              Quizzed {document.quizCount}{" "}
              {document.quizCount === 1 ? "time" : "times"}
            </span>
          ) : (
            <span className="text-muted-foreground">Not quizzed yet</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex gap-2">
        {isQuizReady ? (
          <div className="flex gap-2 flex-1">
            <Button
              onClick={onQuiz}
              className={`flex-1 ${buttonConfig.className || ""}`}
              variant={buttonConfig.variant as any}
              disabled={buttonConfig.disabled}
            >
              {buttonConfig.text}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCustomizeQuiz}
              title="Customize Quiz"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            className={`flex-1 ${buttonConfig.className || ""}`}
            variant={buttonConfig.variant as any}
            disabled={buttonConfig.disabled}
          >
            {buttonConfig.text}
          </Button>
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{document.title}"? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
