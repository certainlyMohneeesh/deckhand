'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRoom } from '@/contexts/RoomContext';
import { 
  BookOpen, 
  Wifi, 
  WifiOff,
  ArrowLeft,
  Play,
  Pause,
  Upload,
  Plus,
  Minus,
  FlipVertical
} from 'lucide-react';
import { toast } from 'sonner';

export default function TeleprompterPage() {
  const router = useRouter();
  const { 
    roomId, 
    currentSlide, 
    totalSlides, 
    isConnected, 
    isReconnecting,
    role,
  } = useRoom();

  const [script, setScript] = useState<string>('');
  const [fontSize, setFontSize] = useState(24);
  const [isAutoScroll, setIsAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(50); // pixels per second
  const [isMirrored, setIsMirrored] = useState(false);
  const scriptRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Redirect if not in a room or not a teleprompter device
    if (!roomId || role !== 'teleprompter') {
      toast.error('Please join a room as Teleprompter');
      router.push('/join');
    }

    // Load pre-uploaded script from sessionStorage
    const savedScript = sessionStorage.getItem('teleprompter-script');
    const savedFilename = sessionStorage.getItem('teleprompter-filename');
    if (savedScript) {
      setScript(savedScript);
      if (savedFilename) {
        toast.success(`Loaded script: ${savedFilename}`);
      }
    }
  }, [roomId, role, router]);

  // Auto-scroll logic
  useEffect(() => {
    if (!isAutoScroll || !scriptRef.current) return;

    const interval = setInterval(() => {
      if (scriptRef.current) {
        scriptRef.current.scrollTop += scrollSpeed / 60; // 60fps
      }
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [isAutoScroll, scrollSpeed]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (!fileType.includes('text') && !fileName.endsWith('.txt') && !fileName.endsWith('.pdf')) {
      toast.error('Please upload a TXT or PDF file');
      return;
    }

    try {
      if (fileName.endsWith('.txt') || fileType.includes('text')) {
        const text = await file.text();
        setScript(text);
        toast.success('Script loaded successfully');
      } else if (fileName.endsWith('.pdf')) {
        // For PDF, we'll use pdf.js to extract text
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = 
          `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        let extractedText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          extractedText += pageText + '\n\n';
        }
        
        setScript(extractedText);
        toast.success(`Extracted text from ${pdf.numPages} pages`);
      }
    } catch (error) {
      console.error('Failed to load script:', error);
      toast.error('Failed to load script');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLeave = () => {
    router.push('/');
  };

  const increaseFontSize = () => {
    if (fontSize < 48) {
      setFontSize(fontSize + 2);
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 16) {
      setFontSize(fontSize - 2);
    }
  };

  const toggleAutoScroll = () => {
    setIsAutoScroll(!isAutoScroll);
    toast.info(isAutoScroll ? 'Auto-scroll disabled' : 'Auto-scroll enabled');
  };

  const toggleMirror = () => {
    setIsMirrored(!isMirrored);
    toast.info(isMirrored ? 'Mirror mode disabled' : 'Mirror mode enabled');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Control Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur border-b border-gray-800">
        <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 gap-2">
          {/* Left Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeave}
              className="text-white hover:bg-white/10 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Leave</span>
            </Button>
            
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
              {isReconnecting ? (
                <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 animate-pulse flex-shrink-0" />
              ) : isConnected ? (
                <Wifi className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
              ) : (
                <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
              )}
              <span className="text-xs sm:text-sm truncate">
                <span className="hidden sm:inline">Room: </span>{roomId}
              </span>
            </div>

            {totalSlides > 0 && (
              <div className="text-xs sm:text-sm text-gray-400 hidden md:block">
                Slide {currentSlide}/{totalSlides}
              </div>
            )}
          </div>

          {/* Center Controls */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={decreaseFontSize}
              className="text-white hover:bg-white/10 h-8 w-8 sm:h-10 sm:w-10 touch-manipulation"
            >
              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <span className="text-xs sm:text-sm min-w-[3rem] sm:min-w-[4rem] text-center">{fontSize}px</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={increaseFontSize}
              className="text-white hover:bg-white/10 h-8 w-8 sm:h-10 sm:w-10 touch-manipulation"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAutoScroll}
              className={`text-white hover:bg-white/10 h-8 w-8 sm:h-10 sm:w-10 touch-manipulation ${
                isAutoScroll ? 'bg-white/20' : ''
              }`}
            >
              {isAutoScroll ? <Pause className="h-3 w-3 sm:h-4 sm:w-4" /> : <Play className="h-3 w-3 sm:h-4 sm:w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMirror}
              className={`text-white hover:bg-white/10 h-8 w-8 sm:h-10 sm:w-10 touch-manipulation ${
                isMirrored ? 'bg-white/20' : ''
              }`}
            >
              <FlipVertical className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {/* Right Controls */}
          <div className="flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,text/plain,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-white border-white/20 hover:bg-white/10 text-xs sm:text-sm h-8 sm:h-10 touch-manipulation"
            >
              <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Upload Script</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Script Display */}
      <div className="pt-16 sm:pt-20 md:pt-24 pb-6 sm:pb-8">
        {script ? (
          <div
            ref={scriptRef}
            className="max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 md:px-8 overflow-y-auto"
            style={{
              height: 'calc(100vh - 6rem)',
              transform: isMirrored ? 'scaleY(-1)' : 'none',
            }}
          >
            <div
              className="leading-relaxed"
              style={{ 
                fontSize: `${fontSize}px`,
                lineHeight: 1.8,
              }}
            >
              {script.split('\n').map((line, i) => (
                <p key={i} className="mb-4">
                  {line || '\u00A0'}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[calc(100vh-8rem)] px-4">
            <Card className="max-w-sm sm:max-w-md bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-base sm:text-lg">No Script Loaded</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-300">
                <p className="text-xs sm:text-sm">
                  Upload a TXT or PDF file to display your speaker notes or script.
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-[44px] touch-manipulation"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Script File
                </Button>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• TXT files: Plain text scripts</p>
                  <p>• PDF files: Text will be extracted automatically</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Current Slide Indicator */}
      {totalSlides > 0 && script && (
        <div className="fixed bottom-3 sm:bottom-4 right-3 sm:right-4 bg-black/90 border border-gray-800 rounded-lg px-3 sm:px-4 py-2">
          <div className="text-xs sm:text-sm text-gray-400">
            Slide {currentSlide}/{totalSlides}
          </div>
          <div className="w-24 sm:w-32 bg-gray-800 rounded-full h-1 mt-2">
            <div 
              className="bg-white h-full rounded-full transition-all"
              style={{ width: `${(currentSlide / totalSlides) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
