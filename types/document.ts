// PDF Document Types
export interface PDFPage {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  dataUrl: string;
  textContent: string;
  notes: string;
  width: number;
  height: number;
}

export interface PDFDocument {
  pages: PDFPage[];
  totalPages: number;
  fileName: string;
  fileSize: number;
}

export interface PDFParseProgress {
  currentPage: number;
  totalPages: number;
  percentage: number;
  status: 'idle' | 'loading' | 'parsing' | 'complete' | 'error';
}

// PPTX Document Types
export interface PPTXSlide {
  slideNumber: number;
  htmlContent: string;
  speakerNotes: string;
  thumbnailUrl?: string;
}

export interface PPTXDocument {
  slides: PPTXSlide[];
  totalSlides: number;
  fileName: string;
  fileSize: number;
}

export interface PPTXParseProgress {
  currentSlide: number;
  totalSlides: number;
  percentage: number;
  status: 'idle' | 'loading' | 'unzipping' | 'parsing' | 'complete' | 'error';
}

// Unified Document Types
export type ParsedDocument = PDFDocument | PPTXDocument;

export type DocumentType = 'pdf' | 'pptx';

export interface DocumentParserError {
  type: 'validation' | 'parsing' | 'rendering' | 'unknown';
  message: string;
  details?: string;
}
