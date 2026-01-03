'use client';

import React, { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface TeleprompterUploadProps {
  className?: string;
}

export const TeleprompterUpload: React.FC<TeleprompterUploadProps> = ({ className }) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (file: File) => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (!fileType.includes('text') && !fileName.endsWith('.txt') && !fileName.endsWith('.pdf')) {
      toast.error('Please upload a TXT or PDF file');
      return;
    }

    try {
      let scriptContent = '';

      if (fileName.endsWith('.txt') || fileType.includes('text')) {
        scriptContent = await file.text();
      } else if (fileName.endsWith('.pdf')) {
        // Extract text from PDF
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = 
          `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          scriptContent += pageText + '\n\n';
        }
      }

      // Store script in sessionStorage
      sessionStorage.setItem('teleprompter-script', scriptContent);
      sessionStorage.setItem('teleprompter-filename', file.name);
      
      toast.success('Script loaded! Join a room to use it.');
      
      // Redirect to join page
      router.push('/join');
    } catch (error) {
      console.error('Failed to load script:', error);
      toast.error('Failed to load script');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <Card
      className={`transition-all duration-200 ${
        isDragging
          ? 'border-purple-500 border-2 bg-purple-500/5 scale-[1.02]'
          : 'border-border hover:border-purple-500/50'
      } ${className}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div
            className={`rounded-full p-4 transition-colors ${
              isDragging ? 'bg-purple-500/20' : 'bg-purple-500/10'
            }`}
          >
            <BookOpen className={`h-8 w-8 ${isDragging ? 'text-purple-500' : 'text-purple-600'}`} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isDragging ? 'Drop your script here' : 'Teleprompter Mode'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Upload a TXT or PDF script to use as a teleprompter
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,text/plain,application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-purple-500 text-purple-600 hover:bg-purple-500/10"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Script
          </Button>

          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center">
              <FileText className="h-3 w-3 mr-1" />
              <span>TXT</span>
            </div>
            <div className="flex items-center">
              <FileText className="h-3 w-3 mr-1" />
              <span>PDF</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
