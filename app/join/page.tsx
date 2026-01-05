'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Monitor, BookOpen, Loader2, Upload, X, ArrowLeft } from 'lucide-react';
import { useRoom } from '@/contexts/RoomContext';
import { normalizeRoomCode, isValidRoomCode } from '@/lib/room';
import { DeviceRole } from '@/types/room';
import { toast } from 'sonner';
import { FileMetadata } from '@/types/file';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

function JoinRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { joinRoom, isConnected } = useRoom();

  const [roomCode, setRoomCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<DeviceRole | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<FileMetadata | null>(null);

  // Auto-fill room code from URL
  useEffect(() => {
    const roomParam = searchParams.get('room');
    if (roomParam) {
      setRoomCode(normalizeRoomCode(roomParam));
    }
  }, [searchParams]);

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = normalizeRoomCode(e.target.value);
    setRoomCode(value.slice(0, 6)); // Limit to 6 characters
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isPDF = file.type === 'application/pdf';
    const isPPTX = file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      file.name.endsWith('.pptx');

    if (!isPDF && !isPPTX) {
      toast.error('Please upload a PDF or PPTX file');
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 50MB');
      return;
    }

    const fileMetadata: FileMetadata = {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      blobUrl: URL.createObjectURL(file),
    };

    setUploadedFile(fileMetadata);
    toast.success(`File "${file.name}" uploaded`);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  const handleJoinRoom = async () => {
    if (!selectedRole) {
      toast.error('Please select a device role');
      return;
    }

    if (!isValidRoomCode(roomCode)) {
      toast.error('Invalid room code. Must be 6 characters.');
      return;
    }

    if (!isConnected) {
      toast.error('Not connected to server. Please wait...');
      return;
    }

    setIsJoining(true);

    try {
      joinRoom(roomCode, selectedRole);

      // Simulate delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      if (selectedRole === 'stage') {
        // Pass file to stage page via context or state management
        // For now, we'll assume the file is handled by the upload component on the stage page
        // or we need to pass it. Since we're using a simple router push, 
        // we might need to rethink how the file gets to the stage page if uploaded here.
        // Ideally, Stage should be created from Home page for the host.
        // Joining as Stage usually means a secondary display, which might sync content.
        router.push('/stage');
      } else if (selectedRole === 'remote') {
        router.push('/remote');
      } else if (selectedRole === 'teleprompter') {
        router.push('/teleprompter');
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      toast.error('Failed to join room. Please try again.');
      setIsJoining(false);
    }
  };

  const roles: { id: DeviceRole; label: string; icon: React.ElementType; description: string }[] = [
    {
      id: 'remote',
      label: 'Remote Control',
      icon: Smartphone,
      description: 'Control slides from your phone'
    },
    {
      id: 'teleprompter',
      label: 'Teleprompter',
      icon: BookOpen,
      description: 'Speaker notes and script'
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-lg border-border shadow-2xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="-ml-2 h-8 w-8 p-0" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <CardTitle className="text-2xl font-bold text-center flex flex-col items-center gap-2">
              <div className="w-10 h-10 relative">
                <Image
                  src="/Deckhand.svg"
                  alt="DeckHand Logo"
                  fill
                  className="object-contain"
                />
              </div>
              Join Room
            </CardTitle>
            <div className="w-8" /> {/* Spacer */}
          </div>
          <CardDescription className="text-center">
            Enter the 6-character code to connect
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Room Code Input */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={roomCode}
                onChange={handleRoomCodeChange}
                placeholder="CODE"
                className="w-full h-16 text-center text-3xl font-mono tracking-[0.5em] uppercase bg-background border-2 border-border rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:tracking-normal placeholder:text-muted-foreground/30"
                maxLength={6}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground ml-1">Select Your Role</label>
            <div className="grid grid-cols-1 gap-3">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={cn(
                    "flex items-center p-4 rounded-xl border-2 transition-all text-left hover:bg-accent/50",
                    selectedRole === role.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-lg mr-4 transition-colors",
                    selectedRole === role.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <role.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">{role.label}</div>
                    <div className="text-xs text-muted-foreground">{role.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload for Stage Role */}
          {selectedRole === 'stage' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">Presentation File</label>
              {!uploadedFile ? (
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-accent/50 transition-colors relative">
                  <input
                    type="file"
                    accept=".pdf,.pptx"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload PDF or PPTX</p>
                  <p className="text-xs text-muted-foreground mt-1">Max 50MB</p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border border-border">
                  <div className="flex items-center truncate min-w-0">
                    <div className="p-2 bg-background rounded mr-3">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium truncate">{uploadedFile.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-8 w-8 shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          <Button
            className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/20"
            onClick={handleJoinRoom}
            disabled={!roomCode || !selectedRole || isJoining || (selectedRole === 'stage' && !uploadedFile)}
          >
            {isJoining ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Room'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <JoinRoomContent />
    </Suspense>
  );
}
