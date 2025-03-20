"use client";
import React, { useState } from "react";
import { FileUpload } from "@/components/ui/file-upload";

export function DocumentUpload() {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileUpload = (files: File[]) => {
    setFiles(files);
    console.log("File selected:", files);
  };

  return <FileUpload onChange={handleFileUpload} />;
}
