'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PDFDocument } from '@/types/document';
import { Button } from '@/components/ui/button';
import { PrivacyScreen } from './PrivacyScreen';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize,
  Grid,
  Play,
  Pause
} from 'lucide-react';

interface PresentationPlayerProps {
  slides: SlideData[];
  onSlideChange?: (slideIndex: number) => void;
  externalSlideIndex?: number;  // External slide index from room sync
  externalFullscreen?: boolean;  // Feature 1: External fullscreen control
  externalAutoPlay?: boolean;    // Feature 1: External auto-play control
  externalShowOverview?: boolean; // Feature 1: External grid view control
  externalPrivacyMode?: boolean;  // Feature 2: External privacy mode control
  onPrivacyExit?: () => void;     // Feature 2: Callback to exit privacy mode
  className?: string;
}

export interface SlideData {
  id: number;
  imageUrl: string;
  textContent?: string;
  notes?: string;
}

export const PresentationPlayer: React.FC<PresentationPlayerProps> = ({
  slides,
  onSlideChange,
  externalSlideIndex,
  externalFullscreen,
  externalAutoPlay,
  externalShowOverview,
  externalPrivacyMode,
  onPrivacyExit,
  className,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const currentSlideRef = useRef(currentSlide);

  // Keep ref in sync with state
  useEffect(() => {
    currentSlideRef.current = currentSlide;
  }, [currentSlide]);

  const totalSlides = slides.length;

  // Sync with external slide index (from room/remote control)
  useEffect(() => {
    if (externalSlideIndex !== undefined && externalSlideIndex >= 0 && externalSlideIndex < totalSlides) {
      // Use ref to avoid stale closure
      if (externalSlideIndex !== currentSlideRef.current) {
        console.log('[PresentationPlayer] Syncing to external slide:', externalSlideIndex, 'from:', currentSlideRef.current);
        setDirection(externalSlideIndex > currentSlideRef.current ? 1 : -1);
        setCurrentSlide(externalSlideIndex);
      }
    }
  }, [externalSlideIndex, totalSlides]);

  // Feature 1: Sync external controls
  // Note: Fullscreen API requires user gesture, so we update internal state
  // User can then click the fullscreen button or press 'f' key
  useEffect(() => {
    if (externalFullscreen !== undefined) {
      console.log('[PresentationPlayer] External fullscreen state:', externalFullscreen);
      setIsFullscreen(externalFullscreen);
      
      // Only attempt fullscreen if we're already in fullscreen mode (for exit)
      if (!externalFullscreen && document.fullscreenElement) {
        console.log('[PresentationPlayer] Exiting fullscreen...');
        document.exitFullscreen().catch(err => {
          console.error('[PresentationPlayer] Exit fullscreen failed:', err);
        });
      }
      // Note: Entering fullscreen remotely not possible due to browser security
      // The internal button state will show "fullscreen requested" state
    }
  }, [externalFullscreen]);

  useEffect(() => {
    if (externalAutoPlay !== undefined) {
      console.log('[PresentationPlayer] External autoPlay changed to:', externalAutoPlay);
      setIsAutoPlaying(externalAutoPlay);
    }
  }, [externalAutoPlay]);

  useEffect(() => {
    if (externalShowOverview !== undefined) {
      console.log('[PresentationPlayer] External showOverview changed to:', externalShowOverview);
      setShowOverview(externalShowOverview);
    }
  }, [externalShowOverview]);

  // Navigation functions
  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      setDirection(index > currentSlide ? 1 : -1);
      setCurrentSlide(index);
      onSlideChange?.(index);
    }
  }, [currentSlide, totalSlides, onSlideChange]);

  const goToNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    }
  }, [currentSlide, totalSlides, goToSlide]);

  const goToPrevious = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          goToPrevious();
          break;
        case 'Home':
          e.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          goToSlide(totalSlides - 1);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (showOverview) {
            setShowOverview(false);
          }
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          setShowOverview(!showOverview);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, goToSlide, totalSlides, showOverview]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide((prev) => {
          if (prev >= totalSlides - 1) {
            setIsAutoPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 5000);
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, totalSlides]);

  // Animation variants for slide transitions
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
        <p className="text-muted-foreground">No slides to display</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden ${className} ${
        isFullscreen ? 'fixed inset-0 z-50' : 'rounded-lg'
      }`}
    >
      {/* Feature 2: Privacy Screen Overlay - Rendered inside fullscreen container */}
      {externalPrivacyMode && (
        <PrivacyScreen onExit={onPrivacyExit} />
      )}

      {/* Slide Overview Grid */}
      <AnimatePresence>
        {showOverview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/95 overflow-auto p-6"
          >
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
              {slides.map((slide, index) => (
                <motion.button
                  key={slide.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => {
                    goToSlide(index);
                    setShowOverview(false);
                  }}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentSlide
                      ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-black'
                      : 'border-transparent hover:border-primary/50'
                  }`}
                >
                  <img
                    src={slide.imageUrl}
                    alt={`Slide ${index + 1}`}
                    className="w-full h-full object-contain bg-white"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 text-xs text-white">
                    {index + 1}
                  </div>
                </motion.button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOverview(false)}
              className="fixed top-4 right-4"
            >
              Close
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Slide View */}
      <div className="relative w-full h-full min-h-[500px] flex items-center justify-center">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.3 },
              scale: { duration: 0.3 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                goToNext();
              } else if (swipe > swipeConfidenceThreshold) {
                goToPrevious();
              }
            }}
            className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <img
              src={slides[currentSlide].imageUrl}
              alt={`Slide ${currentSlide + 1}`}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {/* Click areas for navigation */}
        <div
          className="absolute left-0 top-0 w-1/3 h-full cursor-pointer z-10"
          onClick={goToPrevious}
        />
        <div
          className="absolute right-0 top-0 w-1/3 h-full cursor-pointer z-10"
          onClick={goToNext}
        />
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 p-4"
        >
          <div className="flex items-center gap-2 bg-black/80 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              disabled={currentSlide === 0}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-white text-sm font-medium min-w-[60px] text-center">
              {currentSlide + 1} / {totalSlides}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              disabled={currentSlide === totalSlides - 1}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="w-px h-4 bg-white/20" />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="text-white hover:bg-white/20 h-8 w-8"
              title={isAutoPlaying ? 'Pause' : 'Auto-play'}
            >
              {isAutoPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowOverview(true)}
              className="text-white hover:bg-white/20 h-8 w-8"
              title="Slide Overview (G)"
            >
              <Grid className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20 h-8 w-8"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (F)'}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="h-1 bg-white/10">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      {!isFullscreen && (
        <div className="absolute top-4 right-4 z-20">
          <div className="text-xs text-white/50 bg-black/50 px-2 py-1 rounded">
            Press ? for shortcuts
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationPlayer;
