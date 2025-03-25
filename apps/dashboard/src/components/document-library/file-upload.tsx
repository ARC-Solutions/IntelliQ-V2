"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  onChange: (files: File[]) => void;
  isLoading?: boolean;
  accept?: string;
}

export function FileUpload({
  onChange,
  isLoading = false,
  accept = ".pdf,.doc,.docx,.txt",
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simulate upload progress
  if (isLoading && uploadProgress < 100) {
    setTimeout(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 100));
    }, 200);
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      onChange([file]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      onChange([file]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
          disabled={isLoading}
          name="file"
        />

        {selectedFile ? (
          <div className="flex flex-col items-center justify-center p-6 w-full">
            {isLoading ? (
              <>
                <File className="h-10 w-10 text-primary mb-4" />
                <p className="text-sm font-medium mb-2">
                  Uploading {selectedFile.name}
                </p>
                <Progress
                  value={uploadProgress}
                  className="w-full max-w-xs h-2 mb-2"
                />
                <p className="text-xs text-muted-foreground">
                  {uploadProgress}% complete
                </p>
              </>
            ) : (
              <>
                <File className="h-10 w-10 text-primary mb-4" />
                <p className="text-sm font-medium mb-1">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground mb-4">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="flex items-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">
              Drag and drop your file here
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              or click to browse
            </p>
            <Button
              variant="outline"
              onClick={handleClick}
              disabled={isLoading}
            >
              Select File
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Supported format: PDF • Max file size: 150KB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
