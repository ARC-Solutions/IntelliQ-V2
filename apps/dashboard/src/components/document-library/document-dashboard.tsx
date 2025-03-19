"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SupportedLanguages } from "@/contexts/quiz-context";
import { useQuiz } from "@/contexts/quiz-context";
import type { QuizData } from "@/contexts/quiz-creation-context";
import { createApiClient } from "@/utils/api-client";
import { QuizType } from "@intelliq/api";
import { debounce } from "lodash";
import Lottie from "lottie-react";
import { Paperclip, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import Loading from "../../../public/Loading.json";
import { useToast } from "../ui/use-toast";
import { DocumentCard } from "./document-card";
import { DocumentCardSkeleton } from "./document-card-skeleton";
import { FileUpload } from "./file-upload";
import { Pagination } from "./pagination";

interface Document {
  id: number;
  title: string;
  type: string;
  uploadDate: string;
  size: string;
  quizCount: number;
  processingStatus:
    | "pending"
    | "extracting_text"
    | "chunking"
    | "embedding"
    | "completed"
    | "failed";
}

interface PaginationData {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface DocumentResponse {
  data: Document[];
  pagination: PaginationData;
}

export function DocumentDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [mostQuizzedDocs, setMostQuizzedDocs] = useState<Document[]>([]);
  const RECENT_ITEMS_LIMIT = 6;
  const [isSearching, setIsSearching] = useState(false);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("recent");

  // Use optional chaining to safely access the quiz context
  const quizContext = useQuiz();
  const dispatch = quizContext?.dispatch;

  const fetchDocuments = async (
    page: number,
    limit: number,
    isStatusUpdate = false,
  ) => {
    try {
      if (!isStatusUpdate) {
        setIsLoading(true);
      }

      const client = createApiClient();
      const response = await client.api.v1.documents.$get({
        query: {
          page: page.toString(),
          limit: limit.toString(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }

      const data: DocumentResponse = await response.json();
      setDocuments(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Error fetching documents:", err);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDocuments(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  // Handle page changes
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Handle items per page changes
  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  // Modified handleFileUpload to use API
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", files[0]);

      const response = await fetch(
        "/api/v1/documents/upload",
        {
          method: "POST",
          body: formData,
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      // Refresh the documents list
      await fetchDocuments(currentPage, itemsPerPage);
      setShowUpload(false);

      toast({
        title: "Document uploaded",
        description:
          "Your document is being processed. This may take a few minutes.",
      });

      // Start polling for status updates
      startStatusPolling();
    } catch (err) {
      console.error("Error uploading document:", err);
      toast({
        title: "Upload failed",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Add polling functionality
  const startStatusPolling = () => {
    const pollingInterval = setInterval(async () => {
      const processingDocs = documents.filter((doc) =>
        ["pending", "extracting_text", "chunking", "embedding"].includes(
          doc.processingStatus,
        ),
      );

      if (processingDocs.length === 0) {
        clearInterval(pollingInterval);
        return;
      }

      await fetchDocuments(currentPage, itemsPerPage);
    }, 5000); // Poll every 5 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(pollingInterval);
  };

  // Modify startQuizOnDocument function
  const startQuizOnDocument = async (documentId: string) => {
    const document = documents.find(
      (doc) => doc.id === Number.parseInt(documentId),
    );
    if (!document) return;

    // Check if document is ready
    if (document.processingStatus !== "completed") {
      toast({
        title: "Document not ready",
        description:
          "This document is still being processed. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use isGenerating for the Lottie animation
      setIsGenerating(true);

      // Reset quiz logic state if we have access to it
      if (quizContext?.dispatch) {
        quizContext.dispatch({ type: "RESET_QUIZ" });
      }

      // Generate quiz from document with fixed settings
      // 5 questions, 50% passing score
      if (quizContext?.fetchDocumentQuestions) {
        // Create the quiz data with both quizLanguage and language fields
        const quizData = {
          documentId,
          number: 5, // Fixed at 5 questions
          quizLanguage: "en" as SupportedLanguages,
          language: "en", // Add this line to fix the validation error
          showCorrectAnswers: true,
          passingScore: 50, // Fixed at 50% passing score
          quizType: QuizType.Enum.document,
          questions: [],
          topic: document.title || "Document Quiz",
          description: "Quiz generated from document",
          tags: ["document"],
        } as QuizData;

        await quizContext.fetchDocumentQuestions(quizData);

        // Redirect to the quiz PLAY page
        router.push("/single-player/quiz/play");
      } else {
        toast({
          title: "Error",
          description: "Quiz functionality is not available.",
          variant: "destructive",
        });
      }
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

  // Modify polling effect to use isStatusUpdate flag
  useEffect(() => {
    const processingDocs = documents.filter((doc) =>
      ["pending", "extracting_text", "chunking", "embedding"].includes(
        doc.processingStatus,
      ),
    );

    if (processingDocs.length > 0) {
      const interval = setInterval(() => {
        fetchDocuments(currentPage, itemsPerPage, true); // Pass true for status updates
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [documents]);

  // Modified handleDeleteDocument to use API
  const handleDeleteDocument = async (documentId: number) => {
    try {
      const client = createApiClient();
      const response = await client.api.v1.documents[documentId].$delete();

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      // Refresh the documents list
      await fetchDocuments(currentPage, itemsPerPage);

      toast({
        title: "Document deleted",
        description: "Document has been removed from your library.",
      });
    } catch (err) {
      console.error("Error deleting document:", err);
      toast({
        title: "Delete failed",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  // Reset to first page when search query changes
  // React.useEffect(() => {
  //   setCurrentPage(1);
  // }, [searchQuery]);

  const renderSkeletons = () => {
    return Array(6)
      .fill(0)
      .map((_, index) => <DocumentCardSkeleton key={`skeleton-${index}`} />);
  };

  // Modified to fetch recent documents
  const fetchRecentDocuments = async () => {
    try {
      setIsLoading(true);
      const client = createApiClient();
      const response = await client.api.v1.documents.recent.$get({
        query: {
          limit: RECENT_ITEMS_LIMIT.toString(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recent documents: ${response.status}`);
      }

      const data = await response.json();
      setFilteredDocuments(data.data);
    } catch (err) {
      console.error("Error fetching recent documents:", err);
      toast({
        title: "Error",
        description: "Failed to fetch recent documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Modified to fetch most quizzed documents
  const fetchMostQuizzedDocuments = async () => {
    try {
      setIsLoading(true);
      const client = createApiClient();
      const response = await client.api.v1.documents["most-quizzed"].$get({
        query: {
          limit: RECENT_ITEMS_LIMIT.toString(), // Reusing the same limit
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch most quizzed documents: ${response.status}`,
        );
      }

      const data = await response.json();
      setMostQuizzedDocs(data.data);
    } catch (err) {
      console.error("Error fetching most quizzed documents:", err);
      toast({
        title: "Error",
        description: "Failed to fetch most quizzed documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update useEffect to handle different tabs
  useEffect(() => {
    if (activeTab === "all") {
      fetchDocuments(currentPage, itemsPerPage);
    } else if (activeTab === "recent") {
      fetchRecentDocuments();
    } else if (activeTab === "quizzed") {
      fetchMostQuizzedDocuments();
    }
  }, [activeTab, currentPage, itemsPerPage]);

  // Add effect for local filtering
  useEffect(() => {
    if (!isSearching) {
      if (searchQuery.trim() === "") {
        setFilteredDocuments(documents);
      } else {
        const query = searchQuery.trim().toLowerCase();
        const filtered = documents.filter((doc) =>
          doc.title.toLowerCase().includes(query),
        );
        setFilteredDocuments(filtered);
      }
    }
  }, [searchQuery, documents, isSearching]);

  // Modify the debouncedSearch function to handle pagination
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        fetchDocuments(currentPage, itemsPerPage);
        return;
      }

      try {
        setIsLoading(true);
        setIsSearching(true);

        const client = createApiClient();
        const response = await client.api.v1.documents.search.$post({
          json: {
            query,
            page: currentPage,
            limit: itemsPerPage,
            language: "english",
          },
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        setDocuments(data.data);
        setFilteredDocuments(data.data);
        setPagination(data.pagination);
      } catch (err) {
        console.error("Error searching documents:", err);
        toast({
          title: "Search failed",
          description: "Failed to search documents",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [currentPage, itemsPerPage],
  );

  // Add a new function to handle page changes during search
  const handlePageChangeWithSearch = async (pageNumber: number) => {
    if (isSearching && searchQuery) {
      try {
        setIsLoading(true);
        const client = createApiClient();
        const response = await client.api.v1.documents.search.$post({
          json: {
            query: searchQuery,
            page: pageNumber,
            limit: itemsPerPage,
            language: "english",
          },
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        setDocuments(data.data);
        setFilteredDocuments(data.data);
        setPagination(data.pagination);
      } catch (err) {
        console.error("Error during search pagination:", err);
        toast({
          title: "Search failed",
          description: "Failed to fetch search results",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      handlePageChange(pageNumber);
    }
  };

  // Modify handleSearch for server-side search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setIsSearching(false);
      setFilteredDocuments(documents);
      return;
    }

    try {
      setIsLoading(true);
      setIsSearching(true);

      const client = createApiClient();
      const response = await client.api.v1.documents.search.$post({
        json: {
          query: searchQuery,
          page: currentPage,
          limit: itemsPerPage,
          language: "english",
        },
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      // Update both documents and filtered documents with search results
      setDocuments(data.data);
      setFilteredDocuments(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Error searching documents:", err);
      toast({
        title: "Search failed",
        description: "Failed to search documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update the clear search button handler
  const handleClearSearch = () => {
    setIsSearching(false);
    setSearchQuery("");
    fetchDocuments(currentPage, itemsPerPage); // This will reset to original documents
  };

  // Add the Lottie animation loader before the return statement
  if (isGenerating) {
    return (
      <div className="absolute left-1/2 top-1/2 flex w-[40] -translate-x-1/2 -translate-y-1/2 flex-col items-center md:w-[30vw]">
        <Lottie animationData={Loading} />
      </div>
    );
  }

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
                  accept=".pdf"
                />
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search documents... (Press Enter to search)"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Add search status indicator */}
          {isSearching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Search results for: "{searchQuery}"</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="h-6 px-2"
              >
                Clear
              </Button>
            </div>
          )}

          <Tabs
            defaultValue="recent"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="mb-4 w-full justify-center">
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="quizzed">Most Quizzed</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="mt-0">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderSkeletons()}
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <Paperclip className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">
                    No recent documents found
                  </h3>
                  <p className="text-muted-foreground">
                    Upload your first document to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDocuments.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onQuiz={() => startQuizOnDocument(doc.id.toString())}
                      onDelete={() => handleDeleteDocument(doc.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="mt-0">
              {isInitialLoading || isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderSkeletons()}
                </div>
              ) : documents.length === 0 ? (
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
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        document={doc}
                        onQuiz={() => startQuizOnDocument(doc.id.toString())}
                        onDelete={() => handleDeleteDocument(doc.id)}
                      />
                    ))}
                  </div>

                  {/* Always show pagination when there are documents */}
                  <Pagination
                    currentPage={pagination?.page || 1}
                    totalPages={pagination?.totalPages || 1}
                    onPageChange={handlePageChangeWithSearch}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    totalItems={pagination?.totalItems || documents.length}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="quizzed" className="mt-0">
              {isInitialLoading || isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderSkeletons()}
                </div>
              ) : mostQuizzedDocs.length === 0 ? (
                <div className="text-center py-12">
                  <Paperclip className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">
                    No documents found
                  </h3>
                  <p className="text-muted-foreground">
                    Upload and quiz on documents to see them here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mostQuizzedDocs.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onQuiz={() => startQuizOnDocument(doc.id.toString())}
                      onDelete={() => handleDeleteDocument(doc.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
