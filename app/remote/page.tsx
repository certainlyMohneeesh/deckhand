'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRoom } from '@/contexts/RoomContext';
import { useSlides } from '@/contexts/SlideContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Smartphone, 
  Wifi, 
  WifiOff,
  ArrowLeft,
  Home,
  Maximize,
  Minimize,
  Play,
  Pause,
  Grid3x3,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

export default function RemotePage() {
  const router = useRouter();
  const { slides } = useSlides();
  const { 
    roomId, 
    currentSlide, 
    totalSlides, 
    isConnected, 
    isReconnecting,
    nextSlide, 
    prevSlide,
    goToSlide,
    role,
    connectedDevices,
    toggleFullscreen,
    togglePlay,
    toggleGrid,
    togglePrivacy,
    // Feature 1: Get control states from RoomContext
    isFullscreen: roomIsFullscreen,
    isPlaying: roomIsPlaying,
    showGrid: roomShowGrid,
    // Feature 2: Privacy mode state
    isPrivacyMode: roomIsPrivacyMode,
  } = useRoom();

  const [slidePreview, setSlidePreview] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Computed values - must be declared before useEffect hooks
  const stageDevices = connectedDevices.filter(d => d.role === 'stage');
  const currentSlideData = slides[currentSlide - 1];

  // Sync control states from RoomContext (for display purposes)
  useEffect(() => {
    console.log('[Remote] Syncing showGrid from room:', roomShowGrid);
  }, [roomShowGrid]);

  // Debug: Check if slides are available
  useEffect(() => {
    console.log('[Remote] Slides available:', slides.length, 'totalSlides:', totalSlides);
  }, [slides.length, totalSlides]);

  // Debug: Check connection and navigation state
  useEffect(() => {
    console.log('[Remote] Navigation State:', {
      isConnected,
      currentSlide,
      totalSlides,
      stageDevicesCount: stageDevices.length,
      canGoPrevious: currentSlide > 1,
      canGoNext: totalSlides === 0 || currentSlide < totalSlides
    });
  }, [isConnected, currentSlide, totalSlides, stageDevices.length]);

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
    // Allow next if connected - the stage will enforce actual limits
    // totalSlides might be 0 on remote if not synced yet
    if (totalSlides === 0 || currentSlide < totalSlides) {
      nextSlide();
      toast.success(`Slide ${currentSlide + 1}`);
    }
  };

  const handleLeave = () => {
    router.push('/');
  };

  // Feature 1: Control handlers
  const handleToggleFullscreen = () => {
    const newState = !roomIsFullscreen;
    console.log('[Remote] Toggling fullscreen:', newState, 'roomId:', roomId);
    toggleFullscreen(newState);
    if (newState) {
      toast.info('Fullscreen requested on Stage', {
        description: 'Press F on Stage or use its fullscreen button',
      });
    } else {
      toast.success('Fullscreen OFF');
    }
  };

  const handleTogglePlay = () => {
    const newState = !roomIsPlaying;
    console.log('[Remote] Toggling auto-play:', newState, 'roomId:', roomId);
    togglePlay(newState);
    toast.success(`Auto-play ${newState ? 'ON' : 'OFF'}`);
  };

  const handleToggleGrid = () => {
    const newState = !roomShowGrid;
    console.log('[Remote] Toggling grid view:', newState, 'roomId:', roomId);
    toggleGrid(newState);
  };

  // Feature 2: Privacy mode handler
  const handleTogglePrivacy = () => {
    const newState = !roomIsPrivacyMode;
    console.log('[Remote] Toggling privacy mode:', newState, 'roomId:', roomId);
    togglePrivacy(newState);
    toast.success(`Privacy Screen ${newState ? 'ON' : 'OFF'}`);
  };

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

        {/* Feature 1: Stage Preview */}
        {currentSlideData && (
          <Card className="bg-background/95 backdrop-blur">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2">Current Slide Preview</p>
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img 
                  src={currentSlideData.imageUrl} 
                  alt={`Slide ${currentSlide}`}
                  className="w-full h-full object-contain"
                />
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

        {/* Slide Navigation Buttons */}
        <Card className="bg-background/95 backdrop-blur">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-2 text-center">Navigate Slides</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  console.log('[Remote] Previous slide clicked');
                  prevSlide();
                }}
                disabled={!isConnected || stageDevices.length === 0 || currentSlide <= 1}
                className="flex items-center justify-center space-x-2 h-14"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Previous</span>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  console.log('[Remote] Next slide clicked');
                  nextSlide();
                }}
                disabled={!isConnected || stageDevices.length === 0 || (totalSlides > 0 && currentSlide >= totalSlides)}
                className="flex items-center justify-center space-x-2 h-14"
              >
                <span className="text-sm font-medium">Next</span>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature 1: Presentation Controls */}
        <Card className="bg-background/95 backdrop-blur">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-3">Presentation Controls</p>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={roomIsFullscreen ? "default" : "outline"}
                size="lg"
                onClick={handleToggleFullscreen}
                disabled={!isConnected || stageDevices.length === 0}
                className="flex flex-col h-20 space-y-2"
              >
                {roomIsFullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
                <span className="text-xs">Fullscreen</span>
              </Button>
              
              <Button
                variant={roomIsPlaying ? "default" : "outline"}
                size="lg"
                onClick={handleTogglePlay}
                disabled={!isConnected || stageDevices.length === 0}
                className="flex flex-col h-20 space-y-2"
              >
                {roomIsPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                <span className="text-xs">Auto Play</span>
              </Button>
              
              <Button
                variant={roomShowGrid ? "default" : "outline"}
                size="lg"
                onClick={handleToggleGrid}
                disabled={!isConnected || stageDevices.length === 0}
                className="flex flex-col h-20 space-y-2"
              >
                <Grid3x3 className="h-6 w-6" />
                <span className="text-xs">Grid View</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature 2: Privacy Screen Control */}
        <Card className="bg-background/95 backdrop-blur">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-3">Privacy Mode</p>
            <Button
              variant={roomIsPrivacyMode ? "default" : "outline"}
              size="lg"
              onClick={handleTogglePrivacy}
              disabled={!isConnected || stageDevices.length === 0}
              className="flex items-center justify-center w-full h-20 space-x-3"
            >
              {roomIsPrivacyMode ? <EyeOff className="h-7 w-7" /> : <Eye className="h-7 w-7" />}
              <span className="text-base font-semibold">
                {roomIsPrivacyMode ? 'Privacy ON' : 'Privacy OFF'}
              </span>
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Hide slides and show logo on Stage
            </p>
          </CardContent>
        </Card>

        {/* Feature 1: Grid View - Shows on Remote when toggled */}
        {roomShowGrid && (
          <Card className="bg-background/95 backdrop-blur">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-3">Slide Overview - Tap to Jump</p>
              {slides.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                  {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => {
                      goToSlide(index + 1);
                      toast.success(`Jumped to slide ${index + 1}`);
                    }}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                      index + 1 === currentSlide 
                        ? 'border-primary ring-2 ring-primary' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img 
                      src={slide.imageUrl} 
                      alt={`Slide ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 text-center font-medium">
                      {index + 1}
                    </div>
                  </button>
                ))}
                </div>
              ) : totalSlides > 0 ? (
                // Show numbered grid when slides not loaded locally but we know total count
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-96 overflow-y-auto">
                  {Array.from({ length: totalSlides }, (_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        goToSlide(index + 1);
                        toast.success(`Jumped to slide ${index + 1}`);
                      }}
                      className={`aspect-video rounded-lg flex items-center justify-center border-2 transition-all ${
                        index + 1 === currentSlide 
                          ? 'border-primary bg-primary text-primary-foreground font-bold' 
                          : 'border-border bg-muted hover:border-primary/50 hover:bg-muted/80'
                      }`}
                    >
                      <span className="text-lg font-semibold">{index + 1}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Grid3x3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Grid view is active on Stage display</p>
                  <p className="text-xs mt-2">Navigate slides to populate grid</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
