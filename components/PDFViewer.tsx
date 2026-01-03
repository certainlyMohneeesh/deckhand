'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PDFDocument } from '@/types/document';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

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

  useEffect(() => {
    if (canvasRef.current && document.pages[currentPage - 1]) {
      const page = document.pages[currentPage - 1];
      canvasRef.current.innerHTML = '';
      canvasRef.current.appendChild(page.canvas);
      
      if (onPageChange) {
        onPageChange(currentPage);
      }
    }
  }, [currentPage, document, onPageChange]);

  const goToNextPage = () => {
    if (currentPage < document.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      goToNextPage();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPreviousPage();
    }
  };

  return (
    <div className={`flex flex-col space-y-4 ${className}`} tabIndex={0} onKeyDown={handleKeyDown}>
      {/* Canvas Display */}
      <Card className="relative overflow-hidden bg-muted/20">
        <div 
          ref={canvasRef} 
          className="flex items-center justify-center p-4 min-h-[500px]"
          style={{ maxWidth: '100%', maxHeight: '70vh' }}
        >
          {/* Canvas will be inserted here */}
        </div>
        
        {/* Page Navigation Overlay */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
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
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Page Info */}
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

      {/* Keyboard Shortcuts Help */}
      <p className="text-xs text-muted-foreground text-center">
        Use arrow keys or space to navigate • Press F for fullscreen
      </p>
    </div>
  );
};
