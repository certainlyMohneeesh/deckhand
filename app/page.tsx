'use client';

import { FileUpload } from '@/components/FileUpload';
import { PresentationPlayer } from '@/components/PresentationPlayer';
import { StageControls } from '@/components/StageControls';
import { TeleprompterUpload } from '@/components/TeleprompterUpload';
import { useSlideRenderer } from '@/hooks/useSlideRenderer';
import { useRoom } from '@/contexts/RoomContext';
import { FileMetadata } from '@/types/file';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Loader2, Download, Smartphone, Zap, Globe, Monitor, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [uploadedFile, setUploadedFile] = useState<FileMetadata | null>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const { slides, isLoading, error, progress, renderPDF, renderPPTX, reset } = useSlideRenderer();
  const { createRoom, roomId, setTotalSlides, goToSlide, currentSlide: roomCurrentSlide } = useRoom();

  const handleFileUpload = async (file: FileMetadata) => {
    setUploadedFile(file);
    reset();
    
    const actualFile = file.file;
    
    if (file.type.includes('pdf')) {
      await renderPDF(actualFile, { scale: 2.5 });
    } else if (file.type.includes('presentation') || file.name.endsWith('.pptx')) {
      // Pure client-side PPTX rendering - no backend needed!
      await renderPPTX(actualFile);
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

  const handleBackToUpload = () => {
    setUploadedFile(null);
    setCurrentSlide(1);
    reset();
  };

  const handleSlideChange = (slideIndex: number) => {
    const newSlide = slideIndex + 1;
    setCurrentSlide(newSlide);
    
    // Broadcast slide change if in a room
    if (roomId) {
      goToSlide(newSlide);
    }
  };

  const handleStartPresentation = () => {
    if (!roomId) {
      createRoom('stage');
    }
  };

  // Show presentation viewer when file is uploaded
  if (uploadedFile) {
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
                onClick={handleBackToUpload}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h2 className="text-xl font-semibold truncate max-w-md">
                  {uploadedFile.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? 'Processing...' : `Slide ${currentSlide} of ${slides.length}`}
                </p>
              </div>
            </div>

            {/* Start Presentation Button */}
            {!roomId && !isLoading && slides.length > 0 && (
              <Button onClick={handleStartPresentation} size="lg">
                <Users className="h-4 w-4 mr-2" />
                Start Presentation
              </Button>
            )}
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
              <Button onClick={handleBackToUpload}>Try Again</Button>
            </div>
          )}

          {/* Presentation Player */}
          {!isLoading && !error && slides.length > 0 && (
            <PresentationPlayer
              slides={slides}
              onSlideChange={handleSlideChange}
              externalSlideIndex={currentSlide - 1}  // Convert 1-indexed to 0-indexed
              className="h-[80vh]"
            />
          )}
        </div>
      </div>
    );
  }

  // Home screen with file upload
  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8">
      <main className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            DeckHand
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            View and control presentations from any device. Upload your PDF or PPTX slides 
            and present them beautifully - works everywhere, no installation needed.
          </p>
        </div>

        {/* PDF-Only Notice */}
        <div className="max-w-2xl mx-auto bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-amber-600 dark:text-amber-500 text-xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                PDF Recommended for Best Compatibility
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                For best results, please convert PPTX files to PDF before uploading. 
                While PPTX is supported, PDF provides better compatibility and rendering. 
                <span className="font-medium block mt-1">
                  PowerPoint: File → Save As → PDF
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/join')}
            className="sm:w-auto"
          >
            <Smartphone className="h-5 w-5 mr-2" />
            Join Presentation
          </Button>
        </div>

        {/* File Upload Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Presentation Upload */}
          <FileUpload 
            onFileUpload={handleFileUpload}
          />

          {/* Teleprompter Script Upload */}
          <TeleprompterUpload />
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
          <div className="p-6 rounded-lg border border-border bg-card text-center">
            <Globe className="h-10 w-10 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-2">Works Everywhere</h3>
            <p className="text-sm text-muted-foreground">
              Browser-based rendering works on any device - mobile, tablet, or desktop
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card text-center">
            <Zap className="h-10 w-10 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-2">Fast & Offline</h3>
            <p className="text-sm text-muted-foreground">
              All processing happens locally - no upload delays, works offline
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card text-center">
            <Smartphone className="h-10 w-10 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-2">Remote Control</h3>
            <p className="text-sm text-muted-foreground">
              Control your presentation from your phone with QR code pairing
            </p>
          </div>
        </div>

        {/* Supported Formats */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Supports <span className="font-medium text-foreground">PDF</span> and <span className="font-medium text-foreground">PPTX</span> files up to 50MB</p>
          <p className="mt-1">100% client-side processing - your files never leave your device</p>
        </div>
      </main>
    </div>
  );
}
