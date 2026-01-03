'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Upload, File, X, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFileUpload } from '@/hooks/useFileUpload';
import { FileMetadata } from '@/types/file';

interface FileUploadProps {
  onFileUpload?: (file: FileMetadata) => void;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, className }) => {
  const { file, progress, isUploading, error, uploadFile, clearFile } = useFileUpload();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const uploadedFile = await uploadFile(droppedFiles[0]);
      if (uploadedFile && onFileUpload) {
        onFileUpload(uploadedFile);
      }
    }
  }, [uploadFile, onFileUpload]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const uploadedFile = await uploadFile(selectedFiles[0]);
      if (uploadedFile && onFileUpload) {
        onFileUpload(uploadedFile);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadFile, onFileUpload]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    clearFile();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      <Card
        className={`transition-all duration-200 ${
          isDragging
            ? 'border-primary border-2 bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50'
        } ${error ? 'border-destructive' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          {!file ? (
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div
                className={`rounded-full p-4 transition-colors ${
                  isDragging ? 'bg-primary/20' : 'bg-muted'
                }`}
              >
                <Upload className={`h-12 w-12 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {isDragging ? 'Drop your file here' : 'Upload Presentation'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Drag and drop your PDF or PPTX file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 50MB
                </p>
              </div>

              <Button
                onClick={handleBrowseClick}
                variant="default"
                size="lg"
                disabled={isUploading}
                className="mt-4"
              >
                Browse Files
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.pptx"
                onChange={handleFileSelect}
                className="hidden"
              />

              {error && (
                <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <File className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)} • {file.type.includes('pdf') ? 'PDF' : 'PPTX'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                  className="shrink-0 ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={progress.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Uploading... {progress.percentage}%
                  </p>
                </div>
              )}

              {!isUploading && (
                <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>File uploaded successfully</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
