'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useRoom } from '@/contexts/RoomContext';
import Image from 'next/image';
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
  FlipVertical,
  Settings2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function TeleprompterPage() {
  const router = useRouter();
  const {
    roomId,
    isConnected,
    role,
    currentSlide,
    totalSlides,
  } = useRoom();

  const [script, setScript] = useState<string>('');
  const [fontSize, setFontSize] = useState(48);
  const [isAutoScroll, setIsAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(30); // pixels per second
  const [isMirrored, setIsMirrored] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const scriptRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!roomId || role !== 'teleprompter') {
      toast.error('Please join a room as Teleprompter');
      router.push('/join');
    }

    const savedScript = sessionStorage.getItem('teleprompter-script');
    if (savedScript) setScript(savedScript);
  }, [roomId, role, router]);

  // Auto-scroll logic
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let preciseScroll = scriptRef.current?.scrollTop || 0;

    const scroll = (currentTime: number) => {
      if (!isAutoScroll || !scriptRef.current) return;

      const deltaTime = currentTime - lastTime;
      // Prevent huge jumps if tab was inactive
      if (deltaTime > 100) {
        lastTime = currentTime;
        animationFrameId = requestAnimationFrame(scroll);
        return;
      }

      const pixelsToScroll = (scrollSpeed * deltaTime) / 1000;

      preciseScroll += pixelsToScroll;
      scriptRef.current.scrollTop = preciseScroll;

      // Sync if user manually scrolled significantly (allows manual override)
      if (Math.abs(scriptRef.current.scrollTop - preciseScroll) > 20) {
        preciseScroll = scriptRef.current.scrollTop;
      }

      lastTime = currentTime;
      animationFrameId = requestAnimationFrame(scroll);
    };

    if (isAutoScroll) {
      lastTime = performance.now();
      if (scriptRef.current) {
        preciseScroll = scriptRef.current.scrollTop;
      }
      animationFrameId = requestAnimationFrame(scroll);
    }

    return () => cancelAnimationFrame(animationFrameId);
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
        sessionStorage.setItem('teleprompter-script', text);
        toast.success('Script loaded');
      } else if (fileName.endsWith('.pdf')) {
        try {
          const pdfjs = await import('pdfjs-dist');
          pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            fullText += pageText + '\n\n';
          }

          setScript(fullText);
          sessionStorage.setItem('teleprompter-script', fullText);
          toast.success('PDF script loaded');
        } catch (err) {
          console.error('PDF parsing error:', err);
          toast.error('Failed to parse PDF');
        }
      }
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read file');
    }
  };

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden flex flex-col relative group">

      {/* Top Bar - Branding & Slide Counter */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 pointer-events-none">
        {/* Left: DeckHand Branding */}
        <div className="flex items-center gap-2 pointer-events-auto opacity-60 hover:opacity-100 transition-opacity">
          <div className="w-6 h-6 relative">
            <Image src="/Deckhand.svg" alt="DeckHand" fill className="object-contain" />
          </div>
          <span className="text-sm font-semibold text-white/80">DeckHand</span>
        </div>

        {/* Right: Slide Counter */}
        <div className="pointer-events-auto bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
          <span className="text-sm font-mono font-medium text-white/80">
            {currentSlide} / {totalSlides || '–'}
          </span>
        </div>
      </div>

      {/* Script Display */}
      <div
        ref={scriptRef}
        className={cn(
          "flex-1 overflow-y-auto px-8 py-[40vh] no-scrollbar outline-none",
          isMirrored && "scale-y-[-1]"
        )}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: 1.5,
          textAlign: 'center',
          maxWidth: '100%',
        }}
        onClick={() => setShowControls(!showControls)}
      >
        {script ? (
          <div className="max-w-4xl mx-auto whitespace-pre-wrap font-sans font-bold text-white/90">
            {script}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
            <BookOpen className="w-16 h-16 opacity-20" />
            <p className="text-2xl">No script loaded</p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Upload Script
            </Button>
          </div>
        )}
      </div>

      {/* Floating Controls */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/10 p-4 transition-transform duration-300 ease-in-out z-50",
        !showControls && "translate-y-full"
      )}>
        <div className="max-w-4xl mx-auto flex flex-col gap-4">

          {/* Top Row: Playback & File */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
                className="text-muted-foreground hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")} />
            </div>

            <div className="flex items-center gap-4">
              <Button
                size="lg"
                variant={isAutoScroll ? "destructive" : "default"}
                className="w-32"
                onClick={() => setIsAutoScroll(!isAutoScroll)}
                disabled={!script}
              >
                {isAutoScroll ? <Pause className="mr-2 w-5 h-5" /> : <Play className="mr-2 w-5 h-5" />}
                {isAutoScroll ? "Stop" : "Start"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".txt,.pdf"
                onChange={handleFileUpload}
              />
              <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                variant={isMirrored ? "default" : "outline"}
                size="icon"
                onClick={() => setIsMirrored(!isMirrored)}
              >
                <FlipVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Bottom Row: Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Font Size */}
            <div className="space-y-2 [--primary:var(--pastel-blue)]">
              <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-wider">
                <span className="text-pastel-blue font-bold">Font Size</span>
                <span className="text-pastel-blue">{fontSize}px</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setFontSize(Math.max(20, fontSize - 4))} className="text-pastel-blue hover:text-pastel-blue hover:bg-pastel-blue/10">
                  <Minus className="w-4 h-4" />
                </Button>
                <Slider
                  value={[fontSize]}
                  min={20}
                  max={100}
                  step={1}
                  onValueChange={(value) => setFontSize(value[0])}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => setFontSize(Math.min(100, fontSize + 4))} className="text-pastel-blue hover:text-pastel-blue hover:bg-pastel-blue/10">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Scroll Speed */}
            <div className="space-y-2 [--primary:var(--pastel-green)]">
              <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-wider">
                <span className="text-pastel-green font-bold">Scroll Speed</span>
                <span className="text-pastel-green">{scrollSpeed}px/s</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setScrollSpeed(Math.max(10, scrollSpeed - 5))} className="text-pastel-green hover:text-pastel-green hover:bg-pastel-green/10">
                  <Minus className="w-4 h-4" />
                </Button>
                <Slider
                  value={[scrollSpeed]}
                  min={10}
                  max={100}
                  step={1}
                  onValueChange={(value) => setScrollSpeed(value[0])}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => setScrollSpeed(Math.min(100, scrollSpeed + 5))} className="text-pastel-green hover:text-pastel-green hover:bg-pastel-green/10">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
