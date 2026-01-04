'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { SlideData } from '@/components/PresentationPlayer';

interface SlideContextValue {
  slides: SlideData[];
  isLoading: boolean;
  error: string | null;
  progress: number;
  setSlides: (slides: SlideData[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProgress: (progress: number) => void;
  reset: () => void;
}

const SlideContext = createContext<SlideContextValue | null>(null);

export function useSlides() {
  const context = useContext(SlideContext);
  if (!context) {
    throw new Error('useSlides must be used within SlideProvider');
  }
  return context;
}

interface SlideProviderProps {
  children: React.ReactNode;
}

export function SlideProvider({ children }: SlideProviderProps) {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const reset = useCallback(() => {
    setSlides([]);
    setError(null);
    setProgress(0);
  }, []);

  const contextValue: SlideContextValue = {
    slides,
    isLoading,
    error,
    progress,
    setSlides,
    setIsLoading,
    setError,
    setProgress,
    reset,
  };

  return (
    <SlideContext.Provider value={contextValue}>
      {children}
    </SlideContext.Provider>
  );
}
