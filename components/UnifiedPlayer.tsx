'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FileMetadata } from '@/types/file';
import { PDFDocument, PPTXDocument } from '@/types/document';
import { usePDFParser } from '@/hooks/usePDFParser';
import { usePPTXParser } from '@/hooks/usePPTXParser';
import { PDFViewer } from './PDFViewer';
import { PPTXViewer } from './PPTXViewer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, FileText, Presentation, Maximize, Minimize } from 'lucide-react';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [preloadedPages, setPreloadedPages] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const pdfParser = usePDFParser();
  const pptxParser = usePPTXParser();

  // Preload adjacent slides/pages
  const preloadAdjacentPages = useCallback((current: number, total: number) => {
    const pagesToPreload = new Set<number>();
    
    // Preload current, next, and previous pages
    if (current > 1) pagesToPreload.add(current - 1);
    pagesToPreload.add(current);
    if (current < total) pagesToPreload.add(current + 1);
    
    setPreloadedPages(pagesToPreload);
  }, []);

  // Parse document on mount
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
          preloadAdjacentPages(1, doc.totalPages);
        }
      } else if (isPPTX) {
        setDocumentType('pptx');
        const doc = await pptxParser.parsePPTX(file.file);
        if (doc) {
          setParsedDocument(doc);
          preloadAdjacentPages(1, doc.totalSlides);
        }
      }
    };

    parseDocument();
  }, [file]);

  // Handle page changes with preloading
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    
    if (parsedDocument) {
      const totalPages = 'totalPages' in parsedDocument 
        ? parsedDocument.totalPages 
        : parsedDocument.totalSlides;
      
      preloadAdjacentPages(newPage, totalPages);
    }
    
    onPageChange?.(newPage);
  }, [parsedDocument, onPageChange, preloadAdjacentPages]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

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

  // Render appropriate viewer with fullscreen support
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Fullscreen toggle button */}
      {parsedDocument && (
        <Button
          variant="outline"
          size="icon"
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-50 bg-background/80 backdrop-blur-sm"
          title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      )}

      {/* Document viewer */}
      {parsedDocument && documentType === 'pdf' && (
        <div className={isFullscreen ? 'h-screen' : ''}>
          <PDFViewer 
            document={parsedDocument as PDFDocument} 
            onPageChange={handlePageChange}
            className={isFullscreen ? 'h-full' : ''}
          />
        </div>
      )}

      {parsedDocument && documentType === 'pptx' && (
        <div className={isFullscreen ? 'h-screen' : ''}>
          <PPTXViewer 
            document={parsedDocument as PPTXDocument} 
            onSlideChange={handlePageChange}
            className={isFullscreen ? 'h-full' : ''}
          />
        </div>
      )}

      {!parsedDocument && !isLoading && !error && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <p>Initializing document viewer...</p>
          </div>
        </Card>
      )}
    </div>
  );
};

