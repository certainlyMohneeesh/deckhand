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
              src="/Deckhand.svg"
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

      <main className="flex-1 container mx-auto px-6 flex flex-col lg:flex-row items-start gap-12 lg:gap-24 py-12 lg:py-0 relative">
        {/* Left Content - Minimalist Hero */}
        <div className="flex-1 space-y-8 text-center lg:text-left pt-8 lg:pt-0">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            Remote-controlled <br />
            <span className="text-nesternity-purple">Presentation Deck.</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Show a fullscreen presentation to your audience while you control it from another device. No apps required.
          </p>

          {/* Mobile CTA - Scrolls to Upload Section */}
          <div className="lg:hidden pt-4">
            <Button
              size="lg"
              className="w-full h-14 text-lg bg-white text-black hover:bg-zinc-200 transition-all font-bold rounded-full"
              onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Start Presenting
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Feature List Creative */}
          {/* Feature List Redesigned - Alternating Sections */}
          <div className="space-y-24 py-24">
            {/* Feature 1: Remote Control (Blue/Purple theme) */}
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
              <div className="flex-1 space-y-6 order-2 lg:order-1 text-left">
                <div className="w-fit px-4 py-1.5 rounded-full bg-pastel-blue/10 border border-pastel-blue/20 text-pastel-blue font-semibold text-sm">
                  Remote Control
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                  Control slides from <br />
                  <span className="text-pastel-blue">any device.</span>
                </h3>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  No need to stand behind your laptop. Use your phone as a clicker and see your speaker notes right in your hand.
                </p>
                <ul className="space-y-3 pt-2">
                  <li className="flex items-center gap-3 text-zinc-300">
                    <CheckCircle2 className="w-5 h-5 text-pastel-blue" />
                    <span>Works on any device</span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-300">
                    <CheckCircle2 className="w-5 h-5 text-pastel-blue" />
                    <span>Next, Previous, and Jump to slide and more controls</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 w-full order-1 lg:order-2">
                <div className="aspect-square relative rounded-3xl overflow-hidden bg-zinc-900/50 border border-pastel-blue/20 group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-pastel-blue/5 to-transparent opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-48 h-48 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <Smartphone className="w-20 h-20 text-pastel-blue" />
                      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-xl animate-bounce duration-[3000ms]">
                        <ArrowRight className="w-8 h-8 text-zinc-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Privacy First (Green theme) */}
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
              <div className="flex-1 w-full order-1">
                <div className="aspect-square relative rounded-3xl overflow-hidden bg-zinc-900/50 border border-pastel-green/20 group">
                  <div className="absolute inset-0 bg-gradient-to-bl from-pastel-green/5 to-transparent opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-56 h-40 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col items-center justify-center gap-4 group-hover:-translate-y-2 transition-transform duration-500">
                      <ShieldCheck className="w-16 h-16 text-pastel-green" />
                      <div className="px-4 py-1 rounded-full bg-pastel-green/10 text-pastel-green text-xs font-mono">
                        SECURED
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-6 order-2 text-left">
                <div className="w-fit px-4 py-1.5 rounded-full bg-pastel-green/10 border border-pastel-green/20 text-pastel-green font-semibold text-sm">
                  Privacy First
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                  Your files stay <br />
                  <span className="text-pastel-green">on your device.</span>
                </h3>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  We verify using the room code, but your presentation files are never stored on our servers. Peer-to-peer aesthetic.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-400">
                    No Cloud Storage
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-400">
                    Local Parsing
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Teleprompter (Orange theme) */}
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
              <div className="flex-1 space-y-6 order-2 lg:order-1 text-left">
                <div className="w-fit px-4 py-1.5 rounded-full bg-pastel-orange/10 border border-pastel-orange/20 text-pastel-orange font-semibold text-sm">
                  Teleprompter
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                  Never forget <br />
                  <span className="text-pastel-orange">your lines.</span>
                </h3>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  Speaker notes are automatically extracted and displayed on your remote device, keeping you in sync with your audience.
                </p>
              </div>
              <div className="flex-1 w-full order-1 lg:order-2">
                <div className="aspect-square relative rounded-3xl overflow-hidden bg-zinc-900/50 border border-pastel-orange/20 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-pastel-orange/5 to-transparent opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center p-12">
                    <div className="w-full h-full bg-zinc-950 rounded-xl border border-zinc-800 p-6 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                      <div className="space-y-3 opacity-50">
                        <div className="h-2 w-3/4 bg-zinc-800 rounded-full" />
                        <div className="h-2 w-full bg-zinc-800 rounded-full" />
                        <div className="h-2 w-5/6 bg-zinc-800 rounded-full" />
                      </div>
                      <div className="mt-6 space-y-2">
                        <div className="h-4 w-full bg-pastel-orange/20 rounded-md" />
                        <div className="h-4 w-2/3 bg-pastel-orange/20 rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4: Real-time Sync (Purple/Yellow theme) */}
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
              <div className="flex-1 w-full order-1">
                <div className="aspect-square relative rounded-3xl overflow-hidden bg-zinc-900/50 border border-pastel-purple/20 group">
                  <div className="absolute inset-0 bg-gradient-to-t from-pastel-purple/5 to-transparent opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute -inset-4 bg-pastel-purple/20 blur-xl rounded-full" />
                      <Zap className="w-32 h-32 text-pastel-purple relative z-10 drop-shadow-[0_0_15px_rgba(196,165,255,0.5)]" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-6 order-2 text-left">
                <div className="w-fit px-4 py-1.5 rounded-full bg-pastel-purple/10 border border-pastel-purple/20 text-pastel-purple font-semibold text-sm">
                  Real-time Sync
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                  Instant <br />
                  <span className="text-pastel-purple">Responsiveness.</span>
                </h3>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  Zero latency control ensures your slides change the instant you tap your phone. No awkward pauses.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Card - Clean & Solid & Sticky */}
        <div id="upload-section" className="flex-1 w-full max-w-md lg:max-w-lg sticky top-24 self-start">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
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
