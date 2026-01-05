'use client';

import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { Monitor, ArrowRight, Presentation, Smartphone, Radio, CheckCircle2, ShieldCheck, ScrollText, Zap } from 'lucide-react';
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
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans selection:bg-white/20">
      {/* Navbar - Minimal */}
      <header className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 relative">
            <NextImage 
              src="/deckhand-logo.png" 
              alt="DeckHand Logo" 
              fill 
              className="object-contain"
            />
          </div>
          DeckHand
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          {/* <Link href="/join" className="hover:text-white transition-colors">Join Room</Link> */}
          <Link href="/remote" className="hover:text-white transition-colors">Remote</Link>
          <Link href="/teleprompter" className="hover:text-white transition-colors">Teleprompter</Link>
        </nav>
        <div className="flex items-center gap-4">
          {/* <Button variant="ghost" size="sm" asChild className="hidden sm:flex text-zinc-400 hover:text-white hover:bg-transparent">
            <Link href="/join">Log in</Link>
          </Button> */}
          <Button size="sm" asChild className="bg-white text-black hover:bg-zinc-200 rounded-full px-6 font-medium">
            <Link href="/join">Join Existing</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-24 py-12 lg:py-0">
        {/* Left Content - Minimalist Hero */}
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            Remote-controlled <br/>
            <span className="text-zinc-500">Presentation Deck.</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Show a fullscreen presentation to your audience while you control it from another device. No apps required.
          </p>
          
          {/* Feature List Creative */}
          <div className="grid grid-cols-2 gap-4 pt-8 max-w-lg mx-auto lg:mx-0">
            <div className="group flex flex-col gap-2 p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all duration-300">
              <div className="p-2 w-fit rounded-lg bg-blue-500/10 text-blue-400 group-hover:text-blue-300 group-hover:bg-blue-500/20 transition-colors">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200 text-sm">Remote Control</h3>
                <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">Control from any phone</p>
              </div>
            </div>

            <div className="group flex flex-col gap-2 p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all duration-300">
              <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:text-emerald-300 group-hover:bg-emerald-500/20 transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200 text-sm">Privacy First</h3>
                <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">Files stay on device</p>
              </div>
            </div>

            <div className="group flex flex-col gap-2 p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all duration-300">
              <div className="p-2 w-fit rounded-lg bg-amber-500/10 text-amber-400 group-hover:text-amber-300 group-hover:bg-amber-500/20 transition-colors">
                <ScrollText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200 text-sm">Teleprompter</h3>
                <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">Built-in speech aid</p>
              </div>
            </div>

            <div className="group flex flex-col gap-2 p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all duration-300">
              <div className="p-2 w-fit rounded-lg bg-violet-500/10 text-violet-400 group-hover:text-violet-300 group-hover:bg-violet-500/20 transition-colors">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200 text-sm">Real-time Sync</h3>
                <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">Zero latency control</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Card - Clean & Solid */}
        <div className="flex-1 w-full max-w-md lg:max-w-lg">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            {!uploadedFile ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Start Presenting</h2>
                  <p className="text-zinc-400">Upload your PDF or PPTX to create a room.</p>
                </div>
                
                <div className="bg-zinc-950/50 p-1 rounded-xl border border-zinc-800 border-dashed hover:border-zinc-700 transition-colors">
                  <FileUpload onFileUpload={handleFileUpload} />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-900 px-2 text-zinc-500">Or join existing</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full h-12 text-base border-zinc-700 hover:bg-zinc-800 hover:text-white" asChild>
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
                  <Button variant="ghost" size="sm" onClick={handleBackToUpload} disabled={isLoading} className="text-zinc-400 hover:text-white">
                    Change File
                  </Button>
                </div>

                {isLoading ? (
                  <div className="space-y-6 py-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative">
                        <Spinner className="h-12 w-12 text-white relative z-10" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="font-medium">Processing Slides</p>
                        <p className="text-sm text-zinc-400">{Math.round(progress)}% complete</p>
                      </div>
                    </div>
                    <Progress value={progress} className="h-2 bg-zinc-800" />
                  </div>
                ) : error ? (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 space-y-3">
                    <p className="font-medium">Processing Failed</p>
                    <p className="text-sm opacity-90">{error}</p>
                    <Button variant="destructive" size="sm" onClick={handleBackToUpload} className="w-full">
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 py-4">
                    <div className="aspect-video bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-center relative overflow-hidden group">
                      <Presentation className="h-16 w-16 text-zinc-700" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <p className="font-medium">{slides.length} Slides Ready</p>
                      </div>
                    </div>
                    
                    <Button 
                      size="lg" 
                      className="w-full h-14 text-lg bg-white text-black hover:bg-zinc-200 transition-all font-bold" 
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
