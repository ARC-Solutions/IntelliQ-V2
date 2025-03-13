'use client';
import React, { useState } from 'react';
import { FileUpload } from '@/components/ui/file-upload';

export function DocumentUpload() {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileUpload = (files: File[]) => {
    setFiles(files);
    console.log(files);
  };
  if (files.length > 0) {
    alert('File uploaded');
    setFiles([]);
  }

  return <FileUpload onChange={handleFileUpload} />;
}
