"use client";

import { useState } from "react";
import { Paperclip, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/document-library/file-upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuiz } from "@/contexts/quiz-context";
import { useRouter } from "next/navigation";
import { DocumentCard } from "./document-card";

// Mock data for previously uploaded documents
// In a real app, this would come from your database
const mockDocuments = [
  {
    id: "1",
    title: "Introduction to React",
    type: "PDF",
    uploadDate: "2025-03-15",
    size: "2.4 MB",
    quizCount: 3,
  },
  {
    id: "2",
    title: "JavaScript Fundamentals",
    type: "PDF",
    uploadDate: "2025-03-10",
    size: "1.8 MB",
    quizCount: 2,
  },
  {
    id: "3",
    title: "CSS Grid Layout",
    type: "PDF",
    uploadDate: "2025-03-05",
    size: "1.2 MB",
    quizCount: 1,
  },
  {
    id: "4",
    title: "Next.js Documentation",
    type: "PDF",
    uploadDate: "2025-02-28",
    size: "3.5 MB",
    quizCount: 4,
  },
];

export function DocumentDashboard() {
  const [documents, setDocuments] = useState(mockDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const router = useRouter();
  // Use optional chaining to safely access the quiz context
  const quizContext = useQuiz();
  const dispatch = quizContext?.dispatch;

  // Filter documents based on search query
  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleFileUpload = (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);

    // Simulate upload process
    setTimeout(() => {
      // Add the new document to the list
      const newDoc = {
        id: (documents.length + 1).toString(),
        title: files[0].name.split(".")[0],
        type: files[0].name.split(".").pop()?.toUpperCase() || "PDF",
        uploadDate: new Date().toISOString().split("T")[0],
        size: `${(files[0].size / (1024 * 1024)).toFixed(1)} MB`,
        quizCount: 0,
      };

      setDocuments([newDoc, ...documents]);
      setIsUploading(false);
      setShowUpload(false);

      // In a real app, you would process the file and generate a quiz here
      // For now, we'll just simulate starting a quiz on the new document
      startQuizOnDocument(newDoc.id);
    }, 1500);
  };

  // Function to start a quiz on a document
  const startQuizOnDocument = (documentId: string) => {
    // Find the document
    const document = documents.find((doc) => doc.id === documentId);
    if (!document || !dispatch) return;

    // In a real app, you would fetch the quiz from your backend
    // For now, we'll just dispatch an action to start a quiz
    // dispatch({
    //   type: "START_QUIZ",
    //   payload: {
    //     title: `Quiz on ${document.title}`,
    //     questions: [
    //       {
    //         id: "1",
    //         question: `What is the main topic of ${document.title}?`,
    //         options: ["Option A", "Option B", "Option C", "Option D"],
    //         correctAnswer: "Option A",
    //       },
    //       // More questions would be generated based on the document
    //     ],
    //   },
    // });

    // Navigate to the quiz page
    router.push("/single-player/quiz/play");
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  return (
    <div className="flex items-center justify-center h-screen w-full overflow-hidden">
      <div className="w-full max-w-4xl mx-auto h-full overflow-y-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Document Library</h1>
            <Button onClick={() => setShowUpload(!showUpload)}>
              {showUpload ? (
                "Cancel"
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
          </div>

          {showUpload && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>Upload a new document</CardTitle>
                <CardDescription>
                  Upload a PDF, Word document, or text file to generate quiz
                  questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onChange={handleFileUpload}
                  isLoading={isUploading}
                  accept=".pdf,.doc,.docx,.txt"
                />
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search documents..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="recent" className="w-full">
            <TabsList className="mb-4 w-full justify-center">
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="quizzed">Most Quizzed</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="mt-0">
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <Paperclip className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">
                    No documents found
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "Try a different search term"
                      : "Upload your first document to get started"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDocuments.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onQuiz={() => startQuizOnDocument(doc.id)}
                      onDelete={handleDeleteDocument}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onQuiz={() => startQuizOnDocument(doc.id)}
                    onDelete={handleDeleteDocument}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="quizzed" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocuments
                  .sort((a, b) => b.quizCount - a.quizCount)
                  .map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onQuiz={() => startQuizOnDocument(doc.id)}
                      onDelete={handleDeleteDocument}
                    />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
