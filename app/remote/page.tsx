'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRoom } from '@/contexts/RoomContext';
import { useSlides } from '@/contexts/SlideContext';
import { usePPTXParser } from '@/hooks/usePPTXParser';
import { usePDFParser } from '@/hooks/usePDFParser';
import {
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Maximize,
  Minimize,
  Play,
  Pause,
  Grid3x3,
  Eye,
  EyeOff,
  LogOut,
  Clock,
  X,
  Upload,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function RemotePage() {
  const router = useRouter();
  const { slides } = useSlides();
  const { parsePPTX, isLoading: isParsingPPTX } = usePPTXParser();
  const { parsePDF, isLoading: isParsingPDF } = usePDFParser();
  const isParsing = isParsingPPTX || isParsingPDF;

  const {
    roomId,
    currentSlide,
    totalSlides,
    isConnected,
    nextSlide,
    prevSlide,
    goToSlide,
    role,
    toggleFullscreen,
    togglePlay,
    toggleGrid,
    togglePrivacy,
    isFullscreen: roomIsFullscreen,
    isPlaying: roomIsPlaying,
    showGrid: roomShowGrid,
    isPrivacyMode: roomIsPrivacyMode,
  } = useRoom();

  const [currentTime, setCurrentTime] = useState('');
  const [showLocalGrid, setShowLocalGrid] = useState(false);
  const [localNotes, setLocalNotes] = useState<string[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Swipe handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      if (currentSlide < totalSlides) nextSlide();
    }
    if (isRightSwipe) {
      if (currentSlide > 1) prevSlide();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let notes: string[] = [];

    if (file.name.endsWith('.pptx')) {
      const doc = await parsePPTX(file);
      if (doc) {
        notes = doc.slides.map(s => s.speakerNotes || '');
      }
    } else if (file.type === 'application/pdf') {
      const doc = await parsePDF(file);
      if (doc) {
        // For PDF, we treat each page's text as notes if no explicit notes are found
        // The usePDFParser returns pages with textContent and notes.
        notes = doc.pages.map(p => p.notes || p.textContent || '');
      }
    } else if (file.type === 'text/plain') {
      const text = await file.text();
      // For TXT, we'll just use the same text for all slides or try to split it?
      // Let's just put the whole text in the first slide or replicate it?
      // Better: Just show the full text for the current slide if it's a single text file.
      // We'll fill the array with the same text for now, or maybe the user wants a script.
      // Let's assume it's a script and just show it.
      notes = new Array(totalSlides || 100).fill(text);
    }

    if (notes.length > 0) {
      setLocalNotes(notes);
      toast.success('Notes loaded successfully');
    }
  };

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!roomId || role !== 'remote') {
      toast.error('Please join a room as Remote Control');
      router.push('/join');
    }
  }, [roomId, role, router]);

  const currentSlideData = slides[currentSlide - 1];
  const nextSlideData = slides[currentSlide];
  const currentNote = localNotes[currentSlide - 1] || currentSlideData?.notes;

  const handleGridJump = (index: number) => {
    goToSlide(index + 1);
    setShowLocalGrid(false);
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col safe-area-inset-bottom relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Grid Overlay */}
      {showLocalGrid && (
        <div className="absolute inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col p-4 animate-in fade-in slide-in-from-bottom-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Jump to Slide</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowLocalGrid(false)}>
              <X className="w-6 h-6" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-3 pb-20">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <Button
                key={i}
                variant={currentSlide === i + 1 ? "default" : "outline"}
                className={cn(
                  "h-16 text-xl font-mono",
                  currentSlide === i + 1 && "ring-2 ring-primary ring-offset-2"
                )}
                onClick={() => handleGridJump(i)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className={cn("w-2 h-2 rounded-full animate-pulse", isConnected ? "bg-green-500" : "bg-red-500")} />
          <span className="font-mono text-sm font-medium text-muted-foreground">{roomId}</span>

          {/* DeckHand Branding */}
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border">
            <div className="w-4 h-4 relative">
              <Image src="/Deckhand.svg" alt="DeckHand" fill className="object-contain" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">DeckHand</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{currentTime}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/')}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Control Area */}
      <main className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">

        {/* Slide Info Card (No Preview) */}
        <div className="flex-1 min-h-0 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-medium text-muted-foreground">Current Slide</span>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pptx,.pdf,.txt"
                onChange={handleFileUpload}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
              >
                <Upload className="w-3 h-3" />
                {isParsing ? 'Parsing...' : 'Notes'}
              </Button>
              <span className="text-sm font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                {currentSlide} / {totalSlides}
              </span>
            </div>
          </div>

          <Card className="flex-1 bg-card/30 border-border/50 flex flex-col relative overflow-hidden">
            <div className="flex-1 p-6 w-full overflow-y-auto text-left">
              {currentNote ? (
                <div className="prose prose-invert max-w-none">
                  <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans">
                    {currentNote}
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
                    <FileText className="w-8 h-8 opacity-40" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-medium text-foreground">No notes available</p>
                    <p className="text-xs text-muted-foreground">Slide {currentSlide}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Notes
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Primary Controls - HUGE Buttons for easy touch */}
        <div className="grid grid-cols-2 gap-4 h-48 shrink-0">
          <Button
            variant="outline"
            className="h-full flex flex-col gap-2 text-lg border-border/50 bg-card/30 hover:bg-card/50 active:scale-95 transition-all"
            onClick={prevSlide}
            disabled={currentSlide <= 1}
          >
            <ChevronLeft className="w-8 h-8" />
            <span>Prev</span>
          </Button>

          <Button
            className="h-full flex flex-col gap-2 text-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 active:scale-95 transition-all"
            onClick={nextSlide}
            disabled={currentSlide >= totalSlides}
          >
            <ChevronRight className="w-8 h-8" />
            <span>Next</span>
          </Button>
        </div>

        {/* Secondary Controls */}
        <div className="grid grid-cols-4 gap-2 shrink-0">
          <Button
            variant={roomIsPrivacyMode ? "destructive" : "secondary"}
            size="lg"
            className="h-14 flex flex-col gap-1 text-[10px]"
            onClick={() => togglePrivacy(!roomIsPrivacyMode)}
          >
            {roomIsPrivacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            <span>Blackout</span>
          </Button>

          <Button
            variant={showLocalGrid ? "default" : "secondary"}
            size="lg"
            className="h-14 flex flex-col gap-1 text-[10px]"
            onClick={() => setShowLocalGrid(true)}
          >
            <Grid3x3 className="w-5 h-5" />
            <span>Grid</span>
          </Button>

          <Button
            variant={roomIsFullscreen ? "default" : "secondary"}
            size="lg"
            className="h-14 flex flex-col gap-1 text-[10px]"
            onClick={() => toggleFullscreen(!roomIsFullscreen)}
          >
            {roomIsFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            <span>Full</span>
          </Button>

          <Button
            variant={roomIsPlaying ? "default" : "secondary"}
            size="lg"
            className="h-14 flex flex-col gap-1 text-[10px]"
            onClick={() => togglePlay(!roomIsPlaying)}
          >
            {roomIsPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span>{roomIsPlaying ? 'Pause' : 'Play'}</span>
          </Button>
        </div>
      </main>
    </div>
  );
}
