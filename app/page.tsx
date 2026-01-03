'use client';

import { FileUpload } from '@/components/FileUpload';
import { UnifiedPlayer } from '@/components/UnifiedPlayer';
import { FileMetadata } from '@/types/file';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<FileMetadata | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const handleFileUpload = (file: FileMetadata) => {
    setUploadedFile(file);
    console.log('File uploaded:', file);
  };

  const handleBackToUpload = () => {
    setUploadedFile(null);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (uploadedFile) {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Header with back button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToUpload}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h2 className="text-xl font-semibold truncate max-w-md">
                  {uploadedFile.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Current: Page {currentPage}
                </p>
              </div>
            </div>
          </div>

          {/* Document Player */}
          <UnifiedPlayer 
            file={uploadedFile} 
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8">
      <main className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            DeckHand
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Control your presentations remotely. Upload your slides, scan a QR code with your phone, 
            and transform it into a powerful remote control.
          </p>
        </div>

        {/* File Upload Component */}
        <FileUpload 
          onFileUpload={handleFileUpload}
          className="mx-auto"
        />

        {/* File Info Display */}
        {uploadedFile && (
          <div className="mt-8 p-6 rounded-lg border border-border bg-card">
            <h3 className="text-lg font-semibold mb-4">File Details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium truncate">{uploadedFile.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">{uploadedFile.type.includes('pdf') ? 'PDF' : 'PPTX'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Size</dt>
                <dd className="font-medium">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium text-green-600 dark:text-green-500">Ready</dd>
              </div>
            </dl>
          </div>
        )}

        {/* Feature Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
          <div className="p-6 rounded-lg border border-border bg-card text-center">
            <div className="text-4xl mb-2">📱</div>
            <h3 className="font-semibold mb-2">Remote Control</h3>
            <p className="text-sm text-muted-foreground">
              Use your phone to navigate slides
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card text-center">
            <div className="text-4xl mb-2">✏️</div>
            <h3 className="font-semibold mb-2">Annotations</h3>
            <p className="text-sm text-muted-foreground">
              Draw and highlight on your slides
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card text-center">
            <div className="text-4xl mb-2">📝</div>
            <h3 className="font-semibold mb-2">Speaker Notes</h3>
            <p className="text-sm text-muted-foreground">
              View notes on teleprompter mode
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
