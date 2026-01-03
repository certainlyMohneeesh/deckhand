'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRoom } from '@/contexts/RoomContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Smartphone, 
  Wifi, 
  WifiOff,
  ArrowLeft,
  Home
} from 'lucide-react';
import { toast } from 'sonner';

export default function RemotePage() {
  const router = useRouter();
  const { 
    roomId, 
    currentSlide, 
    totalSlides, 
    isConnected, 
    isReconnecting,
    nextSlide, 
    prevSlide,
    role,
    connectedDevices,
  } = useRoom();

  const [slidePreview, setSlidePreview] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    // Redirect if not in a room or not a remote device
    if (!roomId || role !== 'remote') {
      toast.error('Please join a room as Remote Control');
      router.push('/join');
    }
  }, [roomId, role, router]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevSlide();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        handleNextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, totalSlides, isConnected]);

  // Swipe detection
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
      handleNextSlide();
    } else if (isRightSwipe) {
      handlePrevSlide();
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 1) {
      prevSlide();
      toast.success(`Slide ${currentSlide - 1}`);
    }
  };

  const handleNextSlide = () => {
    if (currentSlide < totalSlides) {
      nextSlide();
      toast.success(`Slide ${currentSlide + 1}`);
    }
  };

  const handleLeave = () => {
    router.push('/');
  };

  const stageDevices = connectedDevices.filter(d => d.role === 'stage');

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-background to-muted p-4"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeave}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Leave
          </Button>
          
          <div className="flex items-center space-x-2">
            {isReconnecting ? (
              <WifiOff className="h-4 w-4 text-yellow-500 animate-pulse" />
            ) : isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              Room: {roomId}
            </span>
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <Card className="border-yellow-500 bg-yellow-500/10">
            <CardContent className="p-4">
              <p className="text-sm text-center">
                {isReconnecting ? 'Reconnecting...' : 'Disconnected from room'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stage Connection Info */}
        {stageDevices.length === 0 ? (
          <Card className="border-orange-500 bg-orange-500/10">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <Home className="h-8 w-8 mx-auto text-orange-500" />
                <p className="text-sm font-medium">No Stage device connected</p>
                <p className="text-xs text-muted-foreground">
                  Waiting for someone to start the presentation...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-500 bg-green-500/10">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <Home className="h-6 w-6 mx-auto text-green-500" />
                <p className="text-xs font-medium">
                  Connected to {stageDevices[0].name}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Slide Display */}
        <Card className="bg-background/95 backdrop-blur">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <Smartphone className="h-12 w-12 mx-auto text-primary" />
              <div>
                <h1 className="text-6xl font-bold">
                  {currentSlide}
                </h1>
                {totalSlides > 0 && (
                  <p className="text-lg text-muted-foreground mt-2">
                    of {totalSlides}
                  </p>
                )}
              </div>
              
              {/* Progress Bar */}
              {totalSlides > 0 && (
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${(currentSlide / totalSlides) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <div className="grid grid-cols-2 gap-4">
          {/* Previous Button */}
          <Button
            onClick={handlePrevSlide}
            disabled={!isConnected || currentSlide <= 1}
            size="lg"
            variant="outline"
            className="h-32 flex flex-col space-y-2"
          >
            <ChevronLeft className="h-12 w-12" />
            <span className="text-lg font-semibold">Previous</span>
          </Button>

          {/* Next Button */}
          <Button
            onClick={handleNextSlide}
            disabled={!isConnected || currentSlide >= totalSlides}
            size="lg"
            className="h-32 flex flex-col space-y-2"
          >
            <ChevronRight className="h-12 w-12" />
            <span className="text-lg font-semibold">Next</span>
          </Button>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-xs text-center text-muted-foreground">
              Tip: Use Left/Right arrow keys or swipe to navigate
            </p>
          </CardContent>
        </Card>

        {/* Device Info */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            {connectedDevices.length} device{connectedDevices.length !== 1 ? 's' : ''} connected
          </p>
        </div>
      </div>
    </div>
  );
}
