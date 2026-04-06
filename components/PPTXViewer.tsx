'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { PPTXDocument } from '@/types/document';
import { SlideView } from '@kandiforge/pptx-renderer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronLeft, ChevronRight, GripHorizontal } from 'lucide-react';

interface PPTXViewerProps {
  document: PPTXDocument;
  onSlideChange?: (slideNumber: number) => void;
  className?: string;
  isFullscreen?: boolean;
}

export const PPTXViewer: React.FC<PPTXViewerProps> = ({ 
  document: pptxDocument,
  onSlideChange,
  className,
  isFullscreen = false,
}) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isOverlayCollapsed, setIsOverlayCollapsed] = useState(false);
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const [overlayPosition, setOverlayPosition] = useState({ x: 16, y: 16 });
  const [renderSize, setRenderSize] = useState({ width: 960, height: 540 });

  const viewportRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const hasDraggedOverlayRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);

  const totalSlides = pptxDocument.pptxData?.slides.length ?? pptxDocument.totalSlides;
  const currentSlideData = pptxDocument.slides[currentSlide - 1];
  const renderedSlide = pptxDocument.pptxData?.slides[currentSlide - 1] ?? currentSlideData?.slideData;
  const sourceSize = useMemo(
    () => pptxDocument.slideSize ?? pptxDocument.pptxData?.size ?? { width: 960, height: 540 },
    [pptxDocument.slideSize, pptxDocument.pptxData]
  );

  const clampOverlayPosition = useCallback((x: number, y: number) => {
    const viewportRect = viewportRef.current?.getBoundingClientRect();
    const overlayRect = overlayRef.current?.getBoundingClientRect();

    if (!viewportRect || !overlayRect) {
      return { x, y };
    }

    const padding = 8;
    const maxX = Math.max(padding, viewportRect.width - overlayRect.width - padding);
    const maxY = Math.max(padding, viewportRect.height - overlayRect.height - padding);

    return {
      x: Math.min(Math.max(x, padding), maxX),
      y: Math.min(Math.max(y, padding), maxY),
    };
  }, []);

  const getDefaultOverlayPosition = useCallback(() => {
    const viewportRect = viewportRef.current?.getBoundingClientRect();
    const overlayRect = overlayRef.current?.getBoundingClientRect();

    if (!viewportRect || !overlayRect) {
      return { x: 16, y: 16 };
    }

    const centeredX = (viewportRect.width - overlayRect.width) / 2;
    const bottomY = viewportRect.height - overlayRect.height - 16;

    return clampOverlayPosition(centeredX, bottomY);
  }, [clampOverlayPosition]);

  const updateRenderSize = useCallback(() => {
    const viewportRect = viewportRef.current?.getBoundingClientRect();

    if (!viewportRect || sourceSize.width <= 0 || sourceSize.height <= 0) {
      return;
    }

    const availableWidth = Math.max(1, viewportRect.width - 32);
    const availableHeight = Math.max(1, viewportRect.height - 32);
    const sourceAspect = sourceSize.width / sourceSize.height;

    let width = availableWidth;
    let height = width / sourceAspect;

    if (height > availableHeight) {
      height = availableHeight;
      width = height * sourceAspect;
    }

    setRenderSize({
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
    });
  }, [sourceSize.height, sourceSize.width]);

  const goToNextSlide = useCallback(() => {
    if (currentSlide < totalSlides) {
      const newSlide = currentSlide + 1;
      setCurrentSlide(newSlide);
      onSlideChange?.(newSlide);
    }
  }, [currentSlide, onSlideChange, totalSlides]);

  const goToPreviousSlide = useCallback(() => {
    if (currentSlide > 1) {
      const newSlide = currentSlide - 1;
      setCurrentSlide(newSlide);
      onSlideChange?.(newSlide);
    }
  }, [currentSlide, onSlideChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const isTypingTarget = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

    if (isTypingTarget) {
      return;
    }

    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      goToNextSlide();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPreviousSlide();
    }
  }, [goToNextSlide, goToPreviousSlide]);

  const handleOverlayPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const viewportRect = viewportRef.current?.getBoundingClientRect();
    if (!viewportRect) {
      return;
    }

    activePointerIdRef.current = event.pointerId;
    setIsDraggingOverlay(true);
    hasDraggedOverlayRef.current = true;

    dragOffsetRef.current = {
      x: event.clientX - viewportRect.left - overlayPosition.x,
      y: event.clientY - viewportRect.top - overlayPosition.y,
    };

    dragHandleRef.current?.setPointerCapture(event.pointerId);
    event.preventDefault();
  }, [overlayPosition.x, overlayPosition.y]);

  const handleOverlayPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingOverlay || activePointerIdRef.current !== event.pointerId) {
      return;
    }

    const viewportRect = viewportRef.current?.getBoundingClientRect();
    if (!viewportRect) {
      return;
    }

    const nextX = event.clientX - viewportRect.left - dragOffsetRef.current.x;
    const nextY = event.clientY - viewportRect.top - dragOffsetRef.current.y;

    setOverlayPosition(clampOverlayPosition(nextX, nextY));
    event.preventDefault();
  }, [clampOverlayPosition, isDraggingOverlay]);

  const endOverlayDrag = useCallback((pointerId: number) => {
    if (activePointerIdRef.current !== pointerId) {
      return;
    }

    activePointerIdRef.current = null;
    setIsDraggingOverlay(false);
    if (dragHandleRef.current?.hasPointerCapture(pointerId)) {
      dragHandleRef.current.releasePointerCapture(pointerId);
    }
  }, []);

  const handleOverlayPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    endOverlayDrag(event.pointerId);
  }, [endOverlayDrag]);

  const handleOverlayPointerCancel = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    endOverlayDrag(event.pointerId);
  }, [endOverlayDrag]);

  // Add keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    hasDraggedOverlayRef.current = false;

    const frameId = window.requestAnimationFrame(() => {
      setCurrentSlide(1);
      setIsOverlayCollapsed(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [pptxDocument.fileName, totalSlides]);

  useEffect(() => {
    const initialFrameId = window.requestAnimationFrame(() => {
      updateRenderSize();
    });

    const viewportElement = viewportRef.current;
    if (!viewportElement) {
      return () => window.cancelAnimationFrame(initialFrameId);
    }

    const observer = new ResizeObserver(() => {
      updateRenderSize();

      setOverlayPosition(currentPosition => {
        if (!hasDraggedOverlayRef.current) {
          return getDefaultOverlayPosition();
        }

        return clampOverlayPosition(currentPosition.x, currentPosition.y);
      });
    });

    observer.observe(viewportElement);

    return () => {
      window.cancelAnimationFrame(initialFrameId);
      observer.disconnect();
    };
  }, [clampOverlayPosition, getDefaultOverlayPosition, updateRenderSize]);

  useEffect(() => {
    const initializeOverlayPosition = () => {
      if (hasDraggedOverlayRef.current) {
        return;
      }

      setOverlayPosition(getDefaultOverlayPosition());
    };

    const animationFrameId = window.requestAnimationFrame(initializeOverlayPosition);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [currentSlide, getDefaultOverlayPosition, isOverlayCollapsed]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setOverlayPosition(currentPosition => {
        if (!hasDraggedOverlayRef.current) {
          return getDefaultOverlayPosition();
        }

        return clampOverlayPosition(currentPosition.x, currentPosition.y);
      });
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [clampOverlayPosition, getDefaultOverlayPosition]);

  useEffect(() => {
    const handleWindowResize = () => {
      updateRenderSize();
      setOverlayPosition(currentPosition => clampOverlayPosition(currentPosition.x, currentPosition.y));
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [clampOverlayPosition, updateRenderSize]);

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {/* Slide Display */}
      <Card className="relative overflow-hidden bg-white dark:bg-zinc-900">
        <div
          ref={viewportRef}
          className={`relative w-full bg-white dark:bg-zinc-900 ${
            isFullscreen ? 'h-full min-h-0' : 'h-[60vh] min-h-[420px]'
          }`}
        >
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 md:p-8">
            {renderedSlide ? (
              <div
                className="overflow-hidden rounded-md border border-border/50 bg-white shadow-lg"
                style={{ width: renderSize.width, height: renderSize.height }}
              >
                <SlideView
                  slide={renderedSlide}
                  slideWidth={sourceSize.width}
                  slideHeight={sourceSize.height}
                  width={renderSize.width}
                  height={renderSize.height}
                />
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border/60 bg-card/60 px-6 py-10 text-center text-sm text-muted-foreground">
                This slide could not be rendered.
              </div>
            )}
          </div>

          {/* Collapsible + Draggable Navigation Overlay */}
          <div
            ref={overlayRef}
            className="absolute z-20 w-auto rounded-lg border border-border bg-background/90 shadow-lg backdrop-blur-sm"
            style={{ left: overlayPosition.x, top: overlayPosition.y }}
          >
            <div className="flex items-center gap-2 border-b border-border/60 px-2 py-1.5">
              <div
                ref={dragHandleRef}
                role="button"
                tabIndex={0}
                aria-label="Drag slide controls"
                className={`flex items-center gap-1 rounded px-1.5 py-1 text-muted-foreground touch-none ${
                  isDraggingOverlay ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                onPointerDown={handleOverlayPointerDown}
                onPointerMove={handleOverlayPointerMove}
                onPointerUp={handleOverlayPointerUp}
                onPointerCancel={handleOverlayPointerCancel}
              >
                <GripHorizontal className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Move</span>
              </div>

              <span className="min-w-[70px] text-center text-xs font-semibold" aria-live="polite">
                {currentSlide} / {totalSlides}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsOverlayCollapsed(prev => !prev)}
                title={isOverlayCollapsed ? 'Expand controls' : 'Collapse controls'}
                aria-expanded={!isOverlayCollapsed}
                aria-label={isOverlayCollapsed ? 'Expand controls' : 'Collapse controls'}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${isOverlayCollapsed ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {!isOverlayCollapsed && (
              <div className="flex items-center justify-center gap-3 p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPreviousSlide}
                  disabled={currentSlide === 1}
                  title="Previous (←)"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextSlide}
                  disabled={currentSlide === totalSlides}
                  title="Next (→ or Space)"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Speaker Notes */}
      {currentSlideData?.speakerNotes && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2 text-sm">Speaker Notes</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {currentSlideData.speakerNotes}
          </p>
        </Card>
      )}
    </div>
  );
};
