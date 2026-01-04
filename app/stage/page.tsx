'use client';

import { PresentationPlayer } from '@/components/PresentationPlayer';
import { StageControls } from '@/components/StageControls';
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
    // Feature 1: Get control states from RoomContext
    isFullscreen,
    isPlaying,
    showGrid
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

  return (
    <div className="min-h-screen p-4 sm:p-8">
      {/* Stage Controls (Room QR, Devices) */}
      {roomId && <StageControls />}
      
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToHome}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-xl font-semibold">
                Stage Display
              </h2>
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Processing...' : `Slide ${currentSlide} of ${slides.length}`}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">
              Rendering slides... {Math.round(progress)}%
            </p>
            <Progress value={progress} className="w-64" />
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
            className="h-[80vh]"
          />
        )}
      </div>
    </div>
  );
}
