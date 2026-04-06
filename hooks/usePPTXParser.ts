import { useState, useCallback } from 'react';
import { parsePPTX as parsePPTXFile } from '@kandiforge/pptx-renderer';
import { PPTXDocument, PPTXSlide, PPTXParseProgress, DocumentParserError } from '@/types/document';
import { toast } from 'sonner';

export const usePPTXParser = () => {
  const [document, setDocument] = useState<PPTXDocument | null>(null);
  const [progress, setProgress] = useState<PPTXParseProgress>({
    currentSlide: 0,
    totalSlides: 0,
    percentage: 0,
    status: 'idle',
  });
  const [error, setError] = useState<DocumentParserError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const parsePPTX = useCallback(async (file: File): Promise<PPTXDocument | null> => {
    setError(null);
    setIsLoading(true);
    setProgress({
      currentSlide: 0,
      totalSlides: 0,
      percentage: 0,
      status: 'loading',
    });

    try {
      setProgress(prev => ({
        ...prev,
        percentage: 20,
        status: 'parsing',
      }));

      const parsedPptx = await parsePPTXFile(file);
      const totalSlides = parsedPptx.slides.length;

      if (totalSlides === 0) {
        throw new Error('No slides found in PPTX file');
      }

      setProgress({
        currentSlide: 0,
        totalSlides,
        percentage: 35,
        status: 'parsing',
      });

      toast.success(`PPTX loaded: ${totalSlides} slides`);

      const slides: PPTXSlide[] = [];

      for (let i = 0; i < parsedPptx.slides.length; i++) {
        const slide = parsedPptx.slides[i];
        const slideNumber = i + 1;

        slides.push({
          slideNumber,
          htmlContent: '',
          speakerNotes: slide.notes?.trim() || '',
          slideData: slide,
        });

        const percentage = 35 + Math.round(((i + 1) / totalSlides) * 60);
        setProgress({
          currentSlide: slideNumber,
          totalSlides,
          percentage,
          status: 'parsing',
        });
      }

      const parsedDocument: PPTXDocument = {
        slides,
        totalSlides,
        fileName: file.name,
        fileSize: file.size,
        pptxData: parsedPptx,
        slideSize: parsedPptx.size,
      };

      setDocument(parsedDocument);
      setProgress({
        currentSlide: totalSlides,
        totalSlides,
        percentage: 100,
        status: 'complete',
      });
      setIsLoading(false);

      toast.success('PPTX parsed successfully!');
      return parsedDocument;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse PPTX';
      const parserError: DocumentParserError = {
        type: 'parsing',
        message: errorMessage,
        details: err instanceof Error ? err.stack : undefined,
      };

      setError(parserError);
      setProgress(prev => ({ ...prev, status: 'error' }));
      setIsLoading(false);
      toast.error(`PPTX parsing failed: ${errorMessage}`);
      
      return null;
    }
  }, []);

  const clearDocument = useCallback(() => {
    setDocument(null);
    setProgress({
      currentSlide: 0,
      totalSlides: 0,
      percentage: 0,
      status: 'idle',
    });
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    document,
    progress,
    error,
    isLoading,
    parsePPTX,
    clearDocument,
  };
};
