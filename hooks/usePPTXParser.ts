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

  const extractStyledHTML = async (xmlObject: any, zip: JSZip, slideRels: any): Promise<string> => {
    let htmlParts: string[] = [];
    
    try {
      const slide = xmlObject['p:sld'];
      if (!slide) return '<div class="slide-content"><p>No content available</p></div>';

      const commonSlide = slide['p:cSld']?.[0];
      if (!commonSlide) return '<div class="slide-content"><p>No content available</p></div>';

      const shapeTree = commonSlide['p:spTree']?.[0];
      if (!shapeTree) return '<div class="slide-content"><p>No content available</p></div>';

      // Process shapes (text boxes, images, etc.)
      const shapes = shapeTree['p:sp'] || [];
      
      for (const shape of shapes) {
        const textBody = shape['p:txBody']?.[0];
        if (textBody) {
          const paragraphs = textBody['a:p'] || [];
          
          for (const para of paragraphs) {
            let paraHTML = '';
            const runs = para['a:r'] || [];
            
            for (const run of runs) {
              const text = run['a:t']?.[0] || '';
              const props = run['a:rPr']?.[0];
              
              let style = '';
              let tag = 'span';
              
              if (props) {
                // Font size
                if (props.$.sz) {
                  const fontSize = parseInt(props.$.sz) / 100; // Convert to pt
                  style += `font-size: ${fontSize}pt;`;
                }
                
                // Bold
                if (props.$.b === '1') {
                  tag = 'strong';
                }
                
                // Italic
                if (props.$.i === '1') {
                  style += 'font-style: italic;';
                }
                
                // Color
                if (props['a:solidFill']) {
                  const colorProps = props['a:solidFill'][0];
                  if (colorProps['a:srgbClr']) {
                    const color = colorProps['a:srgbClr'][0].$.val;
                    style += `color: #${color};`;
                  }
                }
              }
              
              paraHTML += style 
                ? `<${tag} style="${style}">${text}</${tag}>`
                : `<${tag}>${text}</${tag}>`;
            }
            
            if (paraHTML) {
              // Check paragraph properties for alignment, bullets, etc.
              const pPr = para['a:pPr']?.[0];
              let paraStyle = '';
              
              if (pPr) {
                // Alignment
                if (pPr.$.algn) {
                  paraStyle += `text-align: ${pPr.$.algn};`;
                }
                
                // Check for bullets
                const hasBullet = pPr['a:buChar'] || pPr['a:buAutoNum'];
                if (hasBullet) {
                  htmlParts.push(`<li style="${paraStyle}">${paraHTML}</li>`);
                  continue;
                }
              }
              
              htmlParts.push(`<p style="${paraStyle}">${paraHTML}</p>`);
            }
          }
        }
      }

      // Process images
      const pics = shapeTree['p:pic'] || [];
      for (const pic of pics) {
        try {
          const blipFill = pic['p:blipFill']?.[0];
          if (blipFill) {
            const blip = blipFill['a:blip']?.[0];
            if (blip && blip.$['r:embed']) {
              const rId = blip.$['r:embed'];
              
              // Get image from relationships
              if (slideRels && slideRels[rId]) {
                const imagePath = slideRels[rId];
                const imageFile = await zip.file(`ppt/${imagePath}`)?.async('base64');
                
                if (imageFile) {
                  // Determine image type from path
                  const ext = imagePath.split('.').pop()?.toLowerCase();
                  const mimeType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
                  
                  htmlParts.push(`<img src="data:${mimeType};base64,${imageFile}" style="max-width: 100%; height: auto;" alt="Slide image" />`);
                }
              }
            }
          }
        } catch (err) {
          console.error('Error processing image:', err);
        }
      }

      return `<div class="slide-content" style="padding: 20px; font-family: Arial, sans-serif;">${htmlParts.join('')}</div>`;
    } catch (err) {
      console.error('Error extracting styled HTML:', err);
      return '<div class="slide-content"><p>Error rendering slide</p></div>';
    }
  };

  const parseSlideRelationships = async (zip: JSZip, slideNumber: number): Promise<Record<string, string>> => {
    const rels: Record<string, string> = {};
    
    try {
      const relsFile = await zip.file(`ppt/slides/_rels/slide${slideNumber}.xml.rels`)?.async('string');
      if (relsFile) {
        const parsed = await parseStringPromise(relsFile);
        const relationshipsList = parsed?.Relationships?.Relationship || [];
        
        relationshipsList.forEach((rel: any) => {
          rels[rel.$.Id] = rel.$.Target.replace('../', '');
        });
      }
    } catch (err) {
      console.error('Error parsing relationships:', err);
    }
    
    return rels;
  };

  const parseNotesXML = async (xml: string): Promise<string> => {
    try {
      const parsed = await parseStringPromise(xml);
      let notes = '';
      
      // Extract text from notes
      const traverse = (obj: any) => {
        if (typeof obj === 'string') {
          notes += obj + ' ';
          return;
        }
        
        if (Array.isArray(obj)) {
          obj.forEach(traverse);
          return;
        }
        
        if (typeof obj === 'object' && obj !== null) {
          if (obj['a:t']) {
            traverse(obj['a:t']);
          }
          Object.values(obj).forEach(traverse);
        }
      };
      
      traverse(parsed);
      return notes.trim();
    } catch (err) {
      console.error('Error parsing notes XML:', err);
      return '';
    }
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
        const parsedSlideXML = await parseStringPromise(slideXML);
        
        // Get slide relationships for images
        const slideRels = await parseSlideRelationships(zip, slideNumber);
        
        // Extract styled HTML content
        const htmlContent = await extractStyledHTML(parsedSlideXML, zip, slideRels);

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
