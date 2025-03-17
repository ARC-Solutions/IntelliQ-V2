"use client";

import { useState } from "react";
import { FileText, Clock, ArrowUpRight, Trash2 } from "lucide-react";
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

interface Document {
  id: string;
  title: string;
  type: string;
  uploadDate: string;
  size: string;
  quizCount: number;
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

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold line-clamp-1">
            {document.title}
          </CardTitle>
          <Badge variant="outline">{document.type}</Badge>
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
        <Button onClick={onQuiz} className="flex-1" variant="default">
          Start Quiz
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>

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

