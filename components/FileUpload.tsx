'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFileUpload } from '@/hooks/useFileUpload';
import { FileMetadata } from '@/types/file';

interface FileUploadProps {
  onFileUpload?: (file: FileMetadata) => void;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUpload, 
  className 
}) => {
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

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                className="hidden"
                onChange={handleFileSelect}
              />

              <Button
                variant="outline"
                size="lg"
                onClick={handleBrowseClick}
                disabled={isUploading}
              >
                Browse Files
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <File className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Progress indicator */}
              {isUploading && (
                <div className="space-y-2">
                  <Progress value={progress.percentage} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Processing... {progress.percentage}%
                  </p>
                </div>
              )}

              {/* Success state */}
              {!isUploading && !error && (
                <div className="flex items-center justify-center space-x-2 text-green-500">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Ready to present</span>
                </div>
              )}
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="mt-4 flex items-center justify-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
