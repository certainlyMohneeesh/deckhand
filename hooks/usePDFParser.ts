import { useState, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PDFDocument, PDFPage, PDFParseProgress, DocumentParserError } from '@/types/document';
import { toast } from 'sonner';

// Dynamic import for pdfjs-dist to avoid SSR issues
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

const initPDFJS = async () => {
  if (typeof window === 'undefined') return null;
  if (pdfjsLib) return pdfjsLib;
  
  pdfjsLib = await import('pdfjs-dist');
  
  // Configure PDF.js worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  
  return pdfjsLib;
};

const RENDER_SCALE = 2; // 2x scale for high resolution

export const usePDFParser = () => {
  const [document, setDocument] = useState<PDFDocument | null>(null);
  const [progress, setProgress] = useState<PDFParseProgress>({
    currentPage: 0,
    totalPages: 0,
    percentage: 0,
    status: 'idle',
  });
  const [error, setError] = useState<DocumentParserError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const extractTextContent = async (page: any): Promise<string> => {
    try {
      const textContent = await page.getTextContent();
      return textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();
    } catch (err) {
      console.error('Error extracting text:', err);
      return '';
    }
  };

  const extractNotes = async (page: any): Promise<string> => {
    try {
      // Attempt to extract annotations/comments
      const annotations = await page.getAnnotations();
      const notes = annotations
        .filter((annotation: any) => 
          annotation.subtype === 'Text' || 
          annotation.subtype === 'FreeText' ||
          annotation.subtype === 'Popup'
        )
        .map((annotation: any) => annotation.contents || '')
        .filter((content: string) => content.length > 0)
        .join('\n');
      
      return notes;
    } catch (err) {
      console.error('Error extracting notes:', err);
      return '';
    }
  };

  const renderPageToCanvas = async (page: any, pageNumber: number): Promise<PDFPage> => {
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = window.document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get canvas context');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    // Extract text and notes in parallel
    const [textContent, notes] = await Promise.all([
      extractTextContent(page),
      extractNotes(page),
    ]);

    return {
      pageNumber,
      canvas,
      textContent,
      notes,
      width: viewport.width,
      height: viewport.height,
    };
  };

  const parsePDF = useCallback(async (file: File): Promise<PDFDocument | null> => {
    setError(null);
    setIsLoading(true);
    setProgress({
      currentPage: 0,
      totalPages: 0,
      percentage: 0,
      status: 'loading',
    });

    try {
      // Initialize PDF.js
      const pdfjs = await initPDFJS();
      if (!pdfjs) {
        throw new Error('PDF.js not available in this environment');
      }

      // Load PDF document
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;

      const totalPages = pdfDoc.numPages;
      setProgress({
        currentPage: 0,
        totalPages,
        percentage: 0,
        status: 'parsing',
      });

      toast.success(`PDF loaded: ${totalPages} pages`);

      // Parse all pages
      const pages: PDFPage[] = [];
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const parsedPage = await renderPageToCanvas(page, pageNum);
        pages.push(parsedPage);

        // Update progress
        const percentage = Math.round((pageNum / totalPages) * 100);
        setProgress({
          currentPage: pageNum,
          totalPages,
          percentage,
          status: 'parsing',
        });
      }

      const parsedDocument: PDFDocument = {
        pages,
        totalPages,
        fileName: file.name,
        fileSize: file.size,
      };

      setDocument(parsedDocument);
      setProgress({
        currentPage: totalPages,
        totalPages,
        percentage: 100,
        status: 'complete',
      });
      setIsLoading(false);

      toast.success('PDF parsed successfully!');
      return parsedDocument;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse PDF';
      const parserError: DocumentParserError = {
        type: 'parsing',
        message: errorMessage,
        details: err instanceof Error ? err.stack : undefined,
      };

      setError(parserError);
      setProgress(prev => ({ ...prev, status: 'error' }));
      setIsLoading(false);
      toast.error(`PDF parsing failed: ${errorMessage}`);
      
      return null;
    }
  }, []);

  const clearDocument = useCallback(() => {
    setDocument(null);
    setProgress({
      currentPage: 0,
      totalPages: 0,
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
    parsePDF,
    clearDocument,
  };
};
