'use client';

import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { Monitor, ArrowRight, Presentation, Smartphone, Radio } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FileMetadata } from '@/types/file';
import { useSlideRenderer } from '@/hooks/useSlideRenderer';
import { useRoom } from '@/contexts/RoomContext';
import { useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';

export default function Home() {
  const router = useRouter();
  const [uploadedFile, setUploadedFile] = useState<FileMetadata | null>(null);
  const { slides, isLoading, error, progress, renderPDF, renderPPTX, reset } = useSlideRenderer();
  const { createRoom } = useRoom();

  const handleFileUpload = async (file: FileMetadata) => {
    setUploadedFile(file);
    reset();
    
    const actualFile = file.file;
    
    if (file.type.includes('pdf')) {
      await renderPDF(actualFile, { scale: 2.5 });
    } else if (file.type.includes('presentation') || file.name.endsWith('.pptx')) {
      await renderPPTX(actualFile);
    }
  };

  const handleStartPresentation = () => {
    createRoom('stage');
    router.push('/stage');
  };

  const handleBackToUpload = () => {
    setUploadedFile(null);
    reset();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative">
              <NextImage 
                src="/deckhand-logo.png" 
                alt="DeckHand Logo" 
                fill 
                className="object-contain"
              />
            </div>
            <span className="font-bold text-xl tracking-tight">DeckHand</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/join" className="hover:text-foreground transition-colors">Join Room</Link>
            <Link href="/remote" className="hover:text-foreground transition-colors">Remote</Link>
            <Link href="/teleprompter" className="hover:text-foreground transition-colors">Teleprompter</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link href="/join">Join Existing</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/join">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Left Section - Hero & Info (Golden Ratio: ~62%) */}
        <div className="flex-1 lg:flex-[1.618] p-6 lg:p-12 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background -z-10" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 -z-10" />
          
          <div className="max-w-2xl mx-auto lg:mx-0 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                v2.0 Now Available
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                Control your slides <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                  like a pro.
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Seamlessly control your presentations from any device. 
                No dongles, no apps to install. Just a browser and your deck.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                <Smartphone className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="font-semibold mb-1">Remote Control</h3>
                <p className="text-sm text-muted-foreground">Use your phone as a clicker with notes.</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                <Radio className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="font-semibold mb-1">Real-time Sync</h3>
                <p className="text-sm text-muted-foreground">Instant slide changes across all devices.</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                <Monitor className="w-8 h-8 text-green-400 mb-3" />
                <h3 className="font-semibold mb-1">Stage View</h3>
                <p className="text-sm text-muted-foreground">Dedicated view for the main screen.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Action Area (Golden Ratio: ~38%) */}
        <div className="flex-1 lg:flex-1 bg-card border-l border-border p-6 lg:p-12 flex flex-col justify-center shadow-2xl shadow-black/20 z-10">
          <div className="max-w-md mx-auto w-full space-y-8">
            
            {!uploadedFile ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Start Presenting</h2>
                  <p className="text-muted-foreground">Upload your PDF or PPTX to create a room.</p>
                </div>
                
                <div className="bg-background/50 p-1 rounded-2xl border border-border border-dashed">
                  <FileUpload onFileUpload={handleFileUpload} />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or join existing</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full h-12 text-base" asChild>
                  <Link href="/join">
                    Join a Room
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold truncate max-w-[200px]" title={uploadedFile.name}>
                    {uploadedFile.name}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={handleBackToUpload} disabled={isLoading}>
                    Change File
                  </Button>
                </div>

                {isLoading ? (
                  <div className="space-y-6 py-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                        <Spinner className="h-12 w-12 text-primary relative z-10" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="font-medium">Processing Slides</p>
                        <p className="text-sm text-muted-foreground">{Math.round(progress)}% complete</p>
                      </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                ) : error ? (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive space-y-3">
                    <p className="font-medium">Processing Failed</p>
                    <p className="text-sm opacity-90">{error}</p>
                    <Button variant="destructive" size="sm" onClick={handleBackToUpload} className="w-full">
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 py-4">
                    <div className="aspect-video bg-background rounded-lg border border-border flex items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                      <Presentation className="h-16 w-16 text-muted-foreground/50" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <p className="font-medium">{slides.length} Slides Ready</p>
                      </div>
                    </div>
                    
                    <Button 
                      size="lg" 
                      className="w-full h-14 text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" 
                      onClick={handleStartPresentation}
                    >
                      Launch Presentation
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
