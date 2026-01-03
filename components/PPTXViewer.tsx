'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { PPTXDocument } from '@/types/document';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PPTXViewerProps {
  document: PPTXDocument;
  onSlideChange?: (slideNumber: number) => void;
  className?: string;
}

export const PPTXViewer: React.FC<PPTXViewerProps> = ({ 
  document, 
  onSlideChange,
  className 
}) => {
  const [currentSlide, setCurrentSlide] = useState(1);

  const goToNextSlide = useCallback(() => {
    if (currentSlide < document.totalSlides) {
      const newSlide = currentSlide + 1;
      setCurrentSlide(newSlide);
      onSlideChange?.(newSlide);
    }
  }, [currentSlide, document.totalSlides, onSlideChange]);

  const goToPreviousSlide = useCallback(() => {
    if (currentSlide > 1) {
      const newSlide = currentSlide - 1;
      setCurrentSlide(newSlide);
      onSlideChange?.(newSlide);
    }
  }, [currentSlide, onSlideChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      goToNextSlide();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPreviousSlide();
    }
  }, [goToNextSlide, goToPreviousSlide]);

  // Add keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const currentSlideData = document.slides[currentSlide - 1];

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {/* Slide Display */}
      <Card className="relative overflow-hidden bg-white dark:bg-zinc-900">
        <div className="p-8 min-h-[500px] flex items-center justify-center">
          <div 
            className="prose prose-sm dark:prose-invert max-w-none w-full"
            dangerouslySetInnerHTML={{ __html: currentSlideData.htmlContent }}
          />
        </div>
        
        {/* Slide Navigation Overlay */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-border shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousSlide}
            disabled={currentSlide === 1}
            title="Previous (←)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium min-w-[80px] text-center">
            {currentSlide} / {document.totalSlides}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextSlide}
            disabled={currentSlide === document.totalSlides}
            title="Next (→ or Space)"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Speaker Notes */}
      {currentSlideData.speakerNotes && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2 text-sm">Speaker Notes</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {currentSlideData.speakerNotes}
          </p>
        </Card>
      )}
    </div>
  );
};
