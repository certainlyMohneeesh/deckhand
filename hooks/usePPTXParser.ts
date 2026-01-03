import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';
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

  const extractTextFromXML = (xmlObject: any): string => {
    let text = '';
    
    const traverse = (obj: any) => {
      if (typeof obj === 'string') {
        text += obj + ' ';
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(traverse);
        return;
      }
      
      if (typeof obj === 'object' && obj !== null) {
        // Look for text nodes in PPTX XML structure
        if (obj['a:t']) {
          traverse(obj['a:t']);
        }
        
        Object.values(obj).forEach(traverse);
      }
    };
    
    traverse(xmlObject);
    return text.trim();
  };

  const parseSlideXML = async (xml: string): Promise<string> => {
    try {
      const parsed = await parseStringPromise(xml);
      const text = extractTextFromXML(parsed);
      
      // Convert to basic HTML structure
      const paragraphs = text.split(/\n+/).filter(p => p.trim());
      const html = paragraphs.map(p => `<p>${p}</p>`).join('\n');
      
      return html || '<p>No content</p>';
    } catch (err) {
      console.error('Error parsing slide XML:', err);
      return '<p>Error parsing slide content</p>';
    }
  };

  const parseNotesXML = async (xml: string): Promise<string> => {
    try {
      const parsed = await parseStringPromise(xml);
      return extractTextFromXML(parsed);
    } catch (err) {
      console.error('Error parsing notes XML:', err);
      return '';
    }
  };

  const extractSlideRelationships = async (zip: JSZip): Promise<Map<number, string>> => {
    const relationships = new Map<number, string>();
    
    try {
      const relsFile = await zip.file('ppt/_rels/presentation.xml.rels')?.async('string');
      if (relsFile) {
        const parsed = await parseStringPromise(relsFile);
        const relationshipsList = parsed?.Relationships?.Relationship || [];
        
        relationshipsList.forEach((rel: any, index: number) => {
          if (rel.$.Type?.includes('slide') && !rel.$.Type?.includes('slideMaster')) {
            const target = rel.$.Target.replace('../', '');
            relationships.set(index + 1, target);
          }
        });
      }
    } catch (err) {
      console.error('Error extracting relationships:', err);
    }
    
    return relationships;
  };

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
      // Unzip the PPTX file
      setProgress(prev => ({ ...prev, status: 'unzipping' }));
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      // Find all slide files
      const slideFiles = Object.keys(zip.files)
        .filter(filename => filename.match(/^ppt\/slides\/slide\d+\.xml$/))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || '0');
          const numB = parseInt(b.match(/\d+/)?.[0] || '0');
          return numA - numB;
        });

      const totalSlides = slideFiles.length;

      if (totalSlides === 0) {
        throw new Error('No slides found in PPTX file');
      }

      setProgress({
        currentSlide: 0,
        totalSlides,
        percentage: 0,
        status: 'parsing',
      });

      toast.success(`PPTX loaded: ${totalSlides} slides`);

      // Parse all slides
      const slides: PPTXSlide[] = [];

      for (let i = 0; i < slideFiles.length; i++) {
        const slideFile = slideFiles[i];
        const slideNumber = i + 1;

        // Extract slide content
        const slideXML = await zip.file(slideFile)?.async('string') || '';
        const htmlContent = await parseSlideXML(slideXML);

        // Try to find corresponding notes
        const notesFile = `ppt/notesSlides/notesSlide${slideNumber}.xml`;
        let speakerNotes = '';
        
        const notesFileExists = zip.file(notesFile);
        if (notesFileExists) {
          const notesXML = await notesFileExists.async('string');
          speakerNotes = await parseNotesXML(notesXML);
        }

        slides.push({
          slideNumber,
          htmlContent,
          speakerNotes,
        });

        // Update progress
        const percentage = Math.round(((i + 1) / totalSlides) * 100);
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
