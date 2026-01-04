'use client';

import { useState, useCallback, useRef } from 'react';
import { SlideData } from '@/components/PresentationPlayer';
import { useSlides } from '@/contexts/SlideContext';

interface RenderOptions {
  scale?: number;
  quality?: number;
}

interface UseSlideRendererReturn {
  slides: SlideData[];
  isLoading: boolean;
  error: string | null;
  progress: number;
  renderPDF: (file: File, options?: RenderOptions) => Promise<void>;
  renderPPTX: (file: File) => Promise<void>;
  reset: () => void;
}

// PDF.js instance holder
let pdfjsLib: typeof import('pdfjs-dist') | null = null;
let workerInitialized = false;

async function initPDFJS() {
  if (pdfjsLib && workerInitialized) return pdfjsLib;
  
  const pdfjs = await import('pdfjs-dist');
  
  if (!workerInitialized) {
    pdfjs.GlobalWorkerOptions.workerSrc = 
      `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    workerInitialized = true;
  }
  
  pdfjsLib = pdfjs;
  return pdfjs;
}

export function useSlideRenderer(): UseSlideRendererReturn {
  const { slides, isLoading, error, progress, setSlides, setIsLoading, setError, setProgress, reset: contextReset } = useSlides();
  const abortRef = useRef(false);

  const reset = useCallback(() => {
    contextReset();
    abortRef.current = false;
  }, [contextReset]);

  const renderPDF = useCallback(async (file: File, options: RenderOptions = {}) => {
    const { scale = 2, quality = 0.92 } = options;
    
    setIsLoading(true);
    setError(null);
    setProgress(0);
    abortRef.current = false;

    try {
      // Initialize PDF.js
      const pdfjs = await initPDFJS();
      
      // Load the PDF document
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@' + pdfjs.version + '/cmaps/',
        cMapPacked: true,
      });

      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const renderedSlides: SlideData[] = [];

      // Create an offscreen canvas for rendering
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', {
        alpha: false,
        willReadFrequently: false,
      });

      if (!ctx) {
        throw new Error('Failed to create canvas context');
      }

      // Render each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        if (abortRef.current) break;

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // Set canvas size to match the page
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Fill with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render the page - pdfjs-dist v5 requires canvas element
        await page.render({
          canvasContext: ctx,
          viewport,
          canvas,
        } as any).promise;

        // Convert to data URL (high quality PNG/JPEG)
        const imageUrl = canvas.toDataURL('image/png', quality);
        
        // Extract text content for accessibility and search
        const textContent = await page.getTextContent();
        const textItems = textContent.items as Array<{ str: string }>;
        const text = textItems.map(item => item.str).join(' ');

        renderedSlides.push({
          id: pageNum,
          imageUrl,
          textContent: text,
        });

        // Update progress
        setProgress((pageNum / numPages) * 100);

        // Clean up page resources
        page.cleanup();
      }

      setSlides(renderedSlides);
      pdf.destroy();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to render PDF';
      setError(message);
      console.error('PDF render error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const renderPPTX = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setProgress(0);
    abortRef.current = false;

    try {
      const JSZip = (await import('jszip')).default;
      const { parseStringPromise } = await import('xml2js');

      const zip = await JSZip.loadAsync(file);
      
      // Get all slide files
      const slideFiles = Object.keys(zip.files)
        .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
          const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
          return numA - numB;
        });

      if (slideFiles.length === 0) {
        throw new Error('No slides found in PPTX file');
      }

      // Get presentation dimensions
      let slideWidth = 960;
      let slideHeight = 540;

      try {
        const presentationXml = await zip.file('ppt/presentation.xml')?.async('string');
        if (presentationXml) {
          const presentation = await parseStringPromise(presentationXml);
          const sldSz = presentation['p:presentation']?.['p:sldSz']?.[0]?.$;
          if (sldSz) {
            slideWidth = parseInt(sldSz.cx) / 12700 || 960;
            slideHeight = parseInt(sldSz.cy) / 12700 || 540;
          }
        }
      } catch (e) {
        console.warn('Could not parse presentation dimensions:', e);
      }

      // Load theme colors
      const themeColors = await loadThemeColors(zip, parseStringPromise);
      
      const renderedSlides: SlideData[] = [];

      for (let i = 0; i < slideFiles.length; i++) {
        if (abortRef.current) break;

        const slidePath = slideFiles[i];
        const slideXml = await zip.file(slidePath)?.async('string');
        
        if (!slideXml) continue;

        const slideData = await parseStringPromise(slideXml);
        const slideNum = i + 1;

        // Extract shapes and text from slide
        const slideContent = await extractSlideContent(
          slideData, 
          zip, 
          slidePath, 
          themeColors,
          parseStringPromise
        );

        // Render slide to canvas
        const canvas = document.createElement('canvas');
        const scale = 2;
        canvas.width = slideWidth * scale;
        canvas.height = slideHeight * scale;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        // Scale for high DPI
        ctx.scale(scale, scale);

        // Draw background
        ctx.fillStyle = slideContent.backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, slideWidth, slideHeight);

        // Draw background image if present
        if (slideContent.backgroundImage) {
          try {
            const img = await loadImage(slideContent.backgroundImage);
            ctx.drawImage(img, 0, 0, slideWidth, slideHeight);
          } catch (e) {
            console.warn('Failed to load background image');
          }
        }

        // Draw shapes and text
        for (const element of slideContent.elements) {
          await drawElement(ctx, element, slideWidth, slideHeight);
        }

        const imageUrl = canvas.toDataURL('image/png', 0.92);
        
        renderedSlides.push({
          id: slideNum,
          imageUrl,
          textContent: slideContent.textContent,
          notes: slideContent.notes,
        });

        setProgress(((i + 1) / slideFiles.length) * 100);
      }

      setSlides(renderedSlides);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to render PPTX';
      setError(message);
      console.error('PPTX render error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    slides,
    isLoading,
    error,
    progress,
    renderPDF,
    renderPPTX,
    reset,
  };
}

// Helper function to load theme colors
async function loadThemeColors(
  zip: Awaited<ReturnType<typeof import('jszip').loadAsync>>,
  parseStringPromise: (str: string) => Promise<any>
): Promise<Record<string, string>> {
  const colors: Record<string, string> = {
    dk1: '#000000',
    lt1: '#ffffff',
    dk2: '#1f497d',
    lt2: '#eeece1',
    accent1: '#4f81bd',
    accent2: '#c0504d',
    accent3: '#9bbb59',
    accent4: '#8064a2',
    accent5: '#4bacc6',
    accent6: '#f79646',
    hlink: '#0000ff',
    folHlink: '#800080',
  };

  try {
    const themeXml = await zip.file('ppt/theme/theme1.xml')?.async('string');
    if (themeXml) {
      const theme = await parseStringPromise(themeXml);
      const clrScheme = theme['a:theme']?.['a:themeElements']?.[0]?.['a:clrScheme']?.[0];
      
      if (clrScheme) {
        for (const [key, defaultColor] of Object.entries(colors)) {
          const colorDef = clrScheme[`a:${key}`]?.[0];
          if (colorDef) {
            const srgbClr = colorDef['a:srgbClr']?.[0]?.$?.val;
            const sysClr = colorDef['a:sysClr']?.[0]?.$?.lastClr;
            if (srgbClr) colors[key] = `#${srgbClr}`;
            else if (sysClr) colors[key] = `#${sysClr}`;
          }
        }
      }
    }
  } catch (e) {
    console.warn('Could not load theme colors:', e);
  }

  return colors;
}

interface SlideElement {
  type: 'text' | 'shape' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  fontWeight?: string;
  textAlign?: CanvasTextAlign;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  imageData?: string;
}

interface SlideContent {
  elements: SlideElement[];
  textContent: string;
  backgroundColor?: string;
  backgroundImage?: string;
  notes?: string;
}

// Extract content from slide XML
async function extractSlideContent(
  slideData: any,
  zip: Awaited<ReturnType<typeof import('jszip').loadAsync>>,
  slidePath: string,
  themeColors: Record<string, string>,
  parseStringPromise: (str: string) => Promise<any>
): Promise<SlideContent> {
  const elements: SlideElement[] = [];
  const textParts: string[] = [];
  let backgroundColor = '#ffffff';
  let backgroundImage: string | undefined;

  try {
    // Get background
    const cSld = slideData['p:sld']?.['p:cSld']?.[0];
    const bg = cSld?.['p:bg']?.[0];
    
    if (bg) {
      const bgPr = bg['p:bgPr']?.[0];
      const solidFill = bgPr?.['a:solidFill']?.[0];
      if (solidFill) {
        backgroundColor = extractColor(solidFill, themeColors) || '#ffffff';
      }
    }

    // Get shape tree
    const spTree = cSld?.['p:spTree']?.[0];
    
    if (spTree) {
      // Process shapes (sp)
      const shapes = spTree['p:sp'] || [];
      for (const shape of shapes) {
        const element = await processShape(shape, themeColors, zip, slidePath);
        if (element) {
          elements.push(element);
          if (element.text) textParts.push(element.text);
        }
      }

      // Process pictures (pic)
      const pics = spTree['p:pic'] || [];
      for (const pic of pics) {
        const element = await processPicture(pic, zip, slidePath, parseStringPromise);
        if (element) {
          elements.push(element);
        }
      }
    }

    // Get notes
    const slideNum = slidePath.match(/slide(\d+)\.xml/)?.[1];
    let notes: string | undefined;
    
    try {
      const notesPath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
      const notesXml = await zip.file(notesPath)?.async('string');
      if (notesXml) {
        const notesData = await parseStringPromise(notesXml);
        notes = extractNotesText(notesData);
      }
    } catch (e) {
      // Notes not found, that's OK
    }

    return {
      elements,
      textContent: textParts.join('\n'),
      backgroundColor,
      backgroundImage,
      notes,
    };
  } catch (e) {
    console.warn('Error extracting slide content:', e);
    return {
      elements: [],
      textContent: '',
      backgroundColor,
    };
  }
}

// Process shape element
async function processShape(
  shape: any,
  themeColors: Record<string, string>,
  zip: any,
  slidePath: string
): Promise<SlideElement | null> {
  try {
    const spPr = shape['p:spPr']?.[0];
    const txBody = shape['p:txBody']?.[0];
    
    if (!spPr) return null;

    // Get position and size
    const xfrm = spPr['a:xfrm']?.[0];
    const off = xfrm?.['a:off']?.[0]?.$;
    const ext = xfrm?.['a:ext']?.[0]?.$;

    const x = parseInt(off?.x || '0') / 12700;
    const y = parseInt(off?.y || '0') / 12700;
    const width = parseInt(ext?.cx || '0') / 12700;
    const height = parseInt(ext?.cy || '0') / 12700;

    // Get fill color
    let backgroundColor: string | undefined;
    const solidFill = spPr['a:solidFill']?.[0];
    if (solidFill) {
      backgroundColor = extractColor(solidFill, themeColors);
    }

    // Get border
    let borderColor: string | undefined;
    let borderWidth: number | undefined;
    const ln = spPr['a:ln']?.[0];
    if (ln) {
      borderWidth = parseInt(ln.$?.w || '0') / 12700;
      const lnFill = ln['a:solidFill']?.[0];
      if (lnFill) {
        borderColor = extractColor(lnFill, themeColors);
      }
    }

    // Get text content
    let text = '';
    let fontSize = 18;
    let fontFamily = 'Arial, sans-serif';
    let fontColor = '#000000';
    let fontWeight = 'normal';
    let textAlign: CanvasTextAlign = 'left';

    if (txBody) {
      const paragraphs = txBody['a:p'] || [];
      const textLines: string[] = [];

      for (const p of paragraphs) {
        const runs = p['a:r'] || [];
        let lineText = '';

        // Get paragraph properties
        const pPr = p['a:pPr']?.[0];
        if (pPr) {
          const algn = pPr.$?.algn;
          if (algn === 'ctr') textAlign = 'center';
          else if (algn === 'r') textAlign = 'right';
        }

        for (const run of runs) {
          const t = run['a:t']?.[0];
          if (typeof t === 'string') {
            lineText += t;
          } else if (t?._ !== undefined) {
            lineText += t._;
          }

          // Get run properties
          const rPr = run['a:rPr']?.[0];
          if (rPr) {
            const sz = rPr.$?.sz;
            if (sz) fontSize = parseInt(sz) / 100;
            
            const b = rPr.$?.b;
            if (b === '1') fontWeight = 'bold';

            const fillClr = rPr['a:solidFill']?.[0];
            if (fillClr) {
              fontColor = extractColor(fillClr, themeColors) || '#000000';
            }
          }
        }

        if (lineText) textLines.push(lineText);
      }

      text = textLines.join('\n');
    }

    return {
      type: text ? 'text' : 'shape',
      x,
      y,
      width,
      height,
      text,
      fontSize,
      fontFamily,
      fontColor,
      fontWeight,
      textAlign,
      backgroundColor,
      borderColor,
      borderWidth,
    };
  } catch (e) {
    console.warn('Error processing shape:', e);
    return null;
  }
}

// Process picture element
async function processPicture(
  pic: any,
  zip: any,
  slidePath: string,
  parseStringPromise: (str: string) => Promise<any>
): Promise<SlideElement | null> {
  try {
    const spPr = pic['p:spPr']?.[0];
    const blipFill = pic['p:blipFill']?.[0];
    
    if (!spPr || !blipFill) return null;

    // Get position and size
    const xfrm = spPr['a:xfrm']?.[0];
    const off = xfrm?.['a:off']?.[0]?.$;
    const ext = xfrm?.['a:ext']?.[0]?.$;

    const x = parseInt(off?.x || '0') / 12700;
    const y = parseInt(off?.y || '0') / 12700;
    const width = parseInt(ext?.cx || '0') / 12700;
    const height = parseInt(ext?.cy || '0') / 12700;

    // Get image reference
    const blip = blipFill['a:blip']?.[0];
    const embedId = blip?.$?.['r:embed'];

    if (!embedId) return null;

    // Load relationships
    const slideDir = slidePath.replace(/[^/]+$/, '');
    const relsPath = `${slideDir}_rels/${slidePath.split('/').pop()}.rels`;
    const relsXml = await zip.file(relsPath)?.async('string');
    
    if (!relsXml) return null;

    const rels = await parseStringPromise(relsXml);
    const relationships = rels['Relationships']?.['Relationship'] || [];
    
    let imagePath: string | undefined;
    for (const rel of relationships) {
      if (rel.$?.Id === embedId) {
        imagePath = rel.$.Target.replace('../', 'ppt/');
        break;
      }
    }

    if (!imagePath) return null;

    // Load image data
    const imageFile = zip.file(imagePath);
    if (!imageFile) return null;

    const imageData = await imageFile.async('base64');
    const ext2 = imagePath.split('.').pop()?.toLowerCase() || 'png';
    const mimeType = ext2 === 'jpg' || ext2 === 'jpeg' ? 'image/jpeg' : `image/${ext2}`;

    return {
      type: 'image',
      x,
      y,
      width,
      height,
      imageData: `data:${mimeType};base64,${imageData}`,
    };
  } catch (e) {
    console.warn('Error processing picture:', e);
    return null;
  }
}

// Extract color from fill
function extractColor(fill: any, themeColors: Record<string, string>): string | undefined {
  const srgbClr = fill['a:srgbClr']?.[0]?.$?.val;
  if (srgbClr) return `#${srgbClr}`;

  const schemeClr = fill['a:schemeClr']?.[0]?.$?.val;
  if (schemeClr && themeColors[schemeClr]) {
    return themeColors[schemeClr];
  }

  return undefined;
}

// Extract notes text
function extractNotesText(notesData: any): string {
  try {
    const txBody = notesData['p:notes']?.['p:cSld']?.[0]?.['p:spTree']?.[0]?.['p:sp']?.[0]?.['p:txBody']?.[0];
    if (!txBody) return '';

    const paragraphs = txBody['a:p'] || [];
    const textLines: string[] = [];

    for (const p of paragraphs) {
      const runs = p['a:r'] || [];
      for (const run of runs) {
        const t = run['a:t']?.[0];
        if (typeof t === 'string') textLines.push(t);
        else if (t?._ !== undefined) textLines.push(t._);
      }
    }

    return textLines.join('\n');
  } catch (e) {
    return '';
  }
}

// Draw element on canvas
async function drawElement(
  ctx: CanvasRenderingContext2D,
  element: SlideElement,
  slideWidth: number,
  slideHeight: number
): Promise<void> {
  const { type, x, y, width, height } = element;

  if (type === 'image' && element.imageData) {
    try {
      const img = await loadImage(element.imageData);
      ctx.drawImage(img, x, y, width, height);
    } catch (e) {
      console.warn('Failed to draw image');
    }
    return;
  }

  // Draw shape background
  if (element.backgroundColor) {
    ctx.fillStyle = element.backgroundColor;
    ctx.fillRect(x, y, width, height);
  }

  // Draw border
  if (element.borderColor && element.borderWidth) {
    ctx.strokeStyle = element.borderColor;
    ctx.lineWidth = element.borderWidth;
    ctx.strokeRect(x, y, width, height);
  }

  // Draw text
  if (element.text) {
    ctx.fillStyle = element.fontColor || '#000000';
    ctx.font = `${element.fontWeight || 'normal'} ${element.fontSize || 18}px ${element.fontFamily || 'Arial'}`;
    ctx.textAlign = element.textAlign || 'left';
    ctx.textBaseline = 'top';

    const lines = element.text.split('\n');
    const lineHeight = (element.fontSize || 18) * 1.2;
    
    let textX = x;
    if (element.textAlign === 'center') textX = x + width / 2;
    else if (element.textAlign === 'right') textX = x + width;

    for (let i = 0; i < lines.length; i++) {
      const textY = y + i * lineHeight + 5;
      if (textY + lineHeight <= y + height) {
        ctx.fillText(lines[i], textX, textY, width);
      }
    }
  }
}

// Helper to load image
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default useSlideRenderer;
