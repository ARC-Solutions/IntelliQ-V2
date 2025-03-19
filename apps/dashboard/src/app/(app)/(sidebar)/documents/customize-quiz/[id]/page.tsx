"use client";

import { CustomizeQuiz } from "@/components/document-library/customize-quiz";
import { useParams } from "next/navigation";

export const runtime = "edge";

export default function CustomizeQuizPage() {
  const params = useParams();
  const documentId = params.id as string;

  return <CustomizeQuiz documentId={documentId} />;
}