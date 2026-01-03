'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PDFDocument } from '@/types/document';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PDFViewerProps {
  document: PDFDocument;
  onPageChange?: (pageNumber: number) => void;
  className?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ 
  document, 
  onPageChange,
  className 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update canvas when page changes
  useEffect(() => {
    if (canvasRef.current && document.pages[currentPage - 1]) {
      const page = document.pages[currentPage - 1];
      canvasRef.current.innerHTML = '';
      
      // Clone and append canvas
      const clonedCanvas = page.canvas.cloneNode(true) as HTMLCanvasElement;
      clonedCanvas.style.maxWidth = '100%';
      clonedCanvas.style.height = 'auto';
      clonedCanvas.style.display = 'block';
      clonedCanvas.style.margin = '0 auto';
      
      canvasRef.current.appendChild(clonedCanvas);
      
      if (onPageChange) {
        onPageChange(currentPage);
      }
    }
  }, [currentPage, document, onPageChange]);

  const goToNextPage = useCallback(() => {
    if (currentPage < document.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, document.totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      goToNextPage();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPreviousPage();
    }
  }, [goToNextPage, goToPreviousPage]);

  // Add keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div ref={containerRef} className={`flex flex-col space-y-4 ${className}`}>
      {/* Canvas Display */}
      <Card className="relative overflow-hidden bg-muted/20">
        <div 
          ref={canvasRef} 
          className="flex items-center justify-center p-4 min-h-[500px] bg-zinc-100 dark:bg-zinc-900"
        >
          {/* Canvas will be inserted here */}
        </div>
        
        {/* Page Navigation Overlay */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-border shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            title="Previous (←)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium min-w-[80px] text-center">
            {currentPage} / {document.totalPages}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextPage}
            disabled={currentPage === document.totalPages}
            title="Next (→ or Space)"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Page Info */}
      {(document.pages[currentPage - 1]?.textContent || document.pages[currentPage - 1]?.notes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {document.pages[currentPage - 1]?.textContent && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2 text-sm">Page Text (Search Preview)</h3>
              <p className="text-xs text-muted-foreground line-clamp-3">
                {document.pages[currentPage - 1].textContent.substring(0, 200)}...
              </p>
            </Card>
          )}
          
          {document.pages[currentPage - 1]?.notes && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2 text-sm">Notes & Comments</h3>
              <p className="text-xs text-muted-foreground">
                {document.pages[currentPage - 1].notes}
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
