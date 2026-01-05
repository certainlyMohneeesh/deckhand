'use client';

import { PresentationPlayer } from '@/components/PresentationPlayer';
import { useSlideRenderer } from '@/hooks/useSlideRenderer';
import { useRoom } from '@/contexts/RoomContext';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Loader2,
  Maximize2,
  Copy,
  Check,
  Users,
  Smartphone,
  BookOpen,
  ChevronUp,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { generateRoomQRCode } from '@/lib/room';
import Image from 'next/image';

export default function StagePage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(1);
  const { slides, isLoading, error, progress } = useSlideRenderer();
  const {
    roomId,
    setTotalSlides,
    goToSlide,
    currentSlide: roomCurrentSlide,
    togglePrivacy,
    isFullscreen,
    isPlaying,
    showGrid,
    isPrivacyMode,
    isConnected,
    connectedDevices
  } = useRoom();

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true); // Open by default

  // Generate QR code
  useEffect(() => {
    if (roomId) {
      generateRoomQRCode(roomId)
        .then(setQrCodeUrl)
        .catch(console.error);
    }
  }, [roomId]);

  const handleCopyRoomCode = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      toast.success('Room code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleCopyUrl = async () => {
    if (!roomId) return;
    const url = `${window.location.origin}/join?room=${roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Room URL copied!');
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  // Sync slides with room when rendered
  useEffect(() => {
    if (slides.length > 0 && roomId) {
      setTotalSlides(slides.length);
    }
  }, [slides.length, roomId, setTotalSlides]);

  // Sync current slide from room
  useEffect(() => {
    if (roomId && roomCurrentSlide !== currentSlide) {
      setCurrentSlide(roomCurrentSlide);
    }
  }, [roomCurrentSlide, roomId]);

  const handleSlideChange = (slideIndex: number) => {
    const newSlide = slideIndex + 1;
    setCurrentSlide(newSlide);

    // Broadcast slide change if in a room
    if (roomId) {
      goToSlide(newSlide);
    }
  };

  // Redirect to home if not in a room
  useEffect(() => {
    if (!roomId && !isLoading) {
      router.push('/');
    }
  }, [roomId, isLoading, router]);

  // Handle ESC key to exit privacy mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPrivacyMode) {
        togglePrivacy(false);
        toast.info('Privacy mode disabled');
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isPrivacyMode, togglePrivacy]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
        </div>
        <div className="w-64 space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-sm text-muted-foreground">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-destructive space-y-4">
        <h2 className="text-2xl font-bold">Error Loading Presentation</h2>
        <p>{error}</p>
        <Button onClick={() => router.push('/')} variant="outline">Return Home</Button>
      </div>
    );
  }

  const toggleFullscreenHandler = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const remoteDevices = connectedDevices.filter(d => d.role === 'remote');
  const teleprompterDevices = connectedDevices.filter(d => d.role === 'teleprompter');

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden relative">
      {/* Main Player Area - Takes full available space */}
      <div className="flex-1 relative min-h-0">
        <PresentationPlayer
          slides={slides}
          externalSlideIndex={currentSlide - 1}
          onSlideChange={handleSlideChange}
          externalFullscreen={isFullscreen}
          externalAutoPlay={isPlaying}
          externalShowOverview={showGrid}
          externalPrivacyMode={isPrivacyMode}
          onPrivacyExit={() => togglePrivacy(false)}
        />
      </div>

      {/* Floating Toggle Button - Shows when drawer is closed */}
      {!drawerOpen && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full w-12 h-12 shadow-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-background"
          onClick={() => setDrawerOpen(true)}
        >
          <ChevronUp className="w-5 h-5" />
        </Button>
      )}

      {/* Bottom Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="bottom">
        <DrawerContent className="max-h-[60vh] bg-background/95 backdrop-blur-xl">
          <DrawerTitle className="sr-only">Presentation Controls</DrawerTitle>
          <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() => setDrawerOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Left: QR Code & Room Info */}
              <div className="flex flex-col sm:flex-row md:flex-col items-center gap-4">
                {qrCodeUrl && (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white p-1.5 rounded-lg shadow-sm shrink-0">
                    <Image
                      src={qrCodeUrl}
                      alt="Room QR Code"
                      width={120}
                      height={120}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className="text-center sm:text-left md:text-center space-y-2 w-full">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Room Code</p>
                  <div className="flex items-center justify-center sm:justify-start md:justify-center gap-2">
                    <span className="text-2xl sm:text-3xl font-mono font-bold tracking-wider text-primary">
                      {roomId}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyRoomCode}>
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button variant="secondary" size="sm" className="w-full max-w-[180px] h-8 text-xs" onClick={handleCopyUrl}>
                    Copy Join URL
                  </Button>
                </div>
              </div>

              {/* Center: Slide Controls & Status */}
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500 animate-pulse")} />
                  <span className={cn("text-xs", isConnected ? "text-muted-foreground" : "text-red-500")}>
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => handleSlideChange(currentSlide - 2)}
                    disabled={currentSlide <= 1}
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                  </Button>
                  <span className="text-xl font-mono font-medium min-w-[80px] text-center">
                    {currentSlide} / {slides.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => handleSlideChange(currentSlide)}
                    disabled={currentSlide >= slides.length}
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M6.1584 3.13523C6.35985 2.94621 6.67627 2.95603 6.86529 3.15749L10.6153 7.15749C10.7956 7.34982 10.7956 7.6491 10.6153 7.84143L6.86529 11.8414C6.67627 12.0429 6.35985 12.0527 6.1584 11.8637C5.95694 11.6746 5.94712 11.3582 6.13614 11.1568L9.56554 7.49946L6.13614 3.84211C5.94712 3.64066 5.94712 3.32423 6.1584 3.13523Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10" onClick={toggleFullscreenHandler}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Right: Connected Devices */}
              <div className="flex flex-col items-center md:items-start">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Devices ({connectedDevices.length})</span>
                </div>

                <div className="w-full max-w-[200px] space-y-1.5 max-h-24 overflow-y-auto">
                  {connectedDevices.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 italic text-center">Waiting...</p>
                  ) : (
                    <>
                      {remoteDevices.map(device => (
                        <div key={device.id} className="flex items-center justify-between p-1.5 rounded-md bg-secondary/40 text-xs">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-3 h-3 text-primary/70" />
                            <span>Remote</span>
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        </div>
                      ))}
                      {teleprompterDevices.map(device => (
                        <div key={device.id} className="flex items-center justify-between p-1.5 rounded-md bg-secondary/40 text-xs">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-3 h-3 text-blue-500/70" />
                            <span>Teleprompter</span>
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
