'use client';

import React, { useEffect, useState } from 'react';
import { FileMetadata } from '@/types/file';
import { PDFDocument, PPTXDocument } from '@/types/document';
import { usePDFParser } from '@/hooks/usePDFParser';
import { usePPTXParser } from '@/hooks/usePPTXParser';
import { PDFViewer } from './PDFViewer';
import { PPTXViewer } from './PPTXViewer';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, FileText, Presentation } from 'lucide-react';

interface UnifiedPlayerProps {
  file: FileMetadata;
  onPageChange?: (pageNumber: number) => void;
  className?: string;
}

export const UnifiedPlayer: React.FC<UnifiedPlayerProps> = ({ 
  file, 
  onPageChange,
  className 
}) => {
  const [documentType, setDocumentType] = useState<'pdf' | 'pptx' | null>(null);
  const [parsedDocument, setParsedDocument] = useState<PDFDocument | PPTXDocument | null>(null);

  const pdfParser = usePDFParser();
  const pptxParser = usePPTXParser();

  useEffect(() => {
    const parseDocument = async () => {
      // Detect file type
      const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const isPPTX = file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
                     file.name.endsWith('.pptx');

      if (isPDF) {
        setDocumentType('pdf');
        const doc = await pdfParser.parsePDF(file.file);
        if (doc) {
          setParsedDocument(doc);
        }
      } else if (isPPTX) {
        setDocumentType('pptx');
        const doc = await pptxParser.parsePPTX(file.file);
        if (doc) {
          setParsedDocument(doc);
        }
      }
    };

    parseDocument();
  }, [file]);

  const isLoading = pdfParser.isLoading || pptxParser.isLoading;
  const error = pdfParser.error || pptxParser.error;
  const progress = documentType === 'pdf' ? pdfParser.progress : pptxParser.progress;

  // Loading state
  if (isLoading) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            {documentType === 'pdf' && (
              <FileText className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
            )}
            {documentType === 'pptx' && (
              <Presentation className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
            )}
          </div>
          
          <div className="space-y-2 w-full max-w-md">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground capitalize">{progress.status}...</span>
              <span className="font-medium">{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {documentType === 'pdf' 
                ? `Processing page ${'currentPage' in progress ? progress.currentPage : 0} of ${'totalPages' in progress ? progress.totalPages : 0}` 
                : `Processing slide ${'currentSlide' in progress ? progress.currentSlide : 0} of ${'totalSlides' in progress ? progress.totalSlides : 0}`
              }
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="text-center space-y-4">
          <div className="text-destructive text-4xl">⚠️</div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Failed to Load Document</h3>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            {error.details && (
              <details className="mt-4 text-xs text-left bg-muted p-3 rounded">
                <summary className="cursor-pointer font-medium">Technical Details</summary>
                <pre className="mt-2 overflow-x-auto">{error.details}</pre>
              </details>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Render appropriate viewer
  if (parsedDocument && documentType === 'pdf') {
    return <PDFViewer document={parsedDocument as PDFDocument} onPageChange={onPageChange} className={className} />;
  }

  if (parsedDocument && documentType === 'pptx') {
    return <PPTXViewer document={parsedDocument as PPTXDocument} onSlideChange={onPageChange} className={className} />;
  }

  return (
    <Card className={`p-8 ${className}`}>
      <div className="text-center text-muted-foreground">
        <p>Initializing document viewer...</p>
      </div>
    </Card>
  );
};
