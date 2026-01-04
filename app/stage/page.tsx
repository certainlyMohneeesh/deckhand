'use client';

import { PresentationPlayer } from '@/components/PresentationPlayer';
import { StageControls } from '@/components/StageControls';
import { PrivacyScreen } from '@/components/PrivacyScreen';
import { useSlideRenderer } from '@/hooks/useSlideRenderer';
import { useRoom } from '@/contexts/RoomContext';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
    // Feature 1: Get control states from RoomContext
    isFullscreen,
    isPlaying,
    showGrid,
    // Feature 2: Privacy mode
    isPrivacyMode,
  } = useRoom();

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

  const handleBackToHome = () => {
    router.push('/');
  };

  // Redirect to home if not in a room
  useEffect(() => {
    if (!roomId && !isLoading) {
      router.push('/');
    }
  }, [roomId, isLoading, router]);

  // Log control state changes for debugging
  useEffect(() => {
    console.log('[Stage] Fullscreen state changed:', isFullscreen);
    if (isFullscreen && !document.fullscreenElement) {
      // Fullscreen requested remotely but not active - prompt user
      toast.info('Fullscreen requested', {
        description: 'Press F or click the fullscreen button',
        duration: 4000,
      });
    }
  }, [isFullscreen]);

  useEffect(() => {
    console.log('[Stage] Play state changed:', isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    console.log('[Stage] Grid state changed:', showGrid);
  }, [showGrid]);

  // Feature 2: Handle ESC key to exit privacy mode
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

  // Feature 2: Log privacy mode changes
  useEffect(() => {
    console.log('[Stage] Privacy mode changed:', isPrivacyMode);
    if (isPrivacyMode) {
      toast.info('Privacy Screen Active', {
        description: 'Press ESC to exit',
        duration: 3000,
      });
    }
  }, [isPrivacyMode]);

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
      {/* Stage Controls (Room QR, Devices) */}
      {roomId && <StageControls />}
      
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
        {/* Header with back button */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToHome}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-semibold truncate">
                Stage Display
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                {isLoading ? 'Processing...' : `Slide ${currentSlide} of ${slides.length}`}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 animate-spin text-primary" />
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
              Rendering slides... {Math.round(progress)}%
            </p>
            <Progress value={progress} className="w-48 sm:w-64 md:w-80" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
            <p className="text-destructive text-lg">{error}</p>
            <Button onClick={handleBackToHome}>Back to Home</Button>
          </div>
        )}

        {/* Presentation Player */}
        {!isLoading && !error && slides.length > 0 && (
          <PresentationPlayer
            slides={slides}
            onSlideChange={handleSlideChange}
            externalSlideIndex={currentSlide - 1}
            externalFullscreen={isFullscreen}
            externalAutoPlay={isPlaying}
            externalShowOverview={showGrid}
            externalPrivacyMode={isPrivacyMode}
            onPrivacyExit={() => togglePrivacy(false)}
            className="h-[75vh] sm:h-[78vh] md:h-[80vh] lg:h-[82vh] xl:h-[85vh]"
          />
        )}
      </div>
    </div>
  );
}
