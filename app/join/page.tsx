'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Monitor, BookOpen, Loader2, Upload, X } from 'lucide-react';
import { useRoom } from '@/contexts/RoomContext';
import { normalizeRoomCode, isValidRoomCode } from '@/lib/room';
import { DeviceRole } from '@/types/room';
import { toast } from 'sonner';
import { FileMetadata } from '@/types/file';

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
      lastModified: file.lastModified,
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

    // Require file upload for Stage role
    if (selectedRole === 'stage' && !uploadedFile) {
      toast.error('Please upload a presentation file for Stage Display');
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
      
      // Navigate based on role
      setTimeout(() => {
        if (selectedRole === 'remote') {
          router.push('/remote');
        } else if (selectedRole === 'teleprompter') {
          router.push('/teleprompter');
        } else {
          router.push('/');
        }
      }, 500);
    } catch (error) {
      console.error('Join error:', error);
      toast.error('Failed to join room');
      setIsJoining(false);
    }
  };

  const roles: { value: DeviceRole; icon: typeof Monitor; label: string; description: string; color: string }[] = [
    {
      value: 'stage',
      icon: Monitor,
      label: 'Stage Display',
      description: 'Main presentation screen',
      color: 'border-primary bg-primary/5',
    },
    {
      value: 'remote',
      icon: Smartphone,
      label: 'Remote Control',
      description: 'Control slides from your device',
      color: 'border-blue-500 bg-blue-500/5',
    },
    {
      value: 'teleprompter',
      icon: BookOpen,
      label: 'Teleprompter',
      description: 'View speaker notes',
      color: 'border-purple-500 bg-purple-500/5',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Presentation</CardTitle>
          <CardDescription>
            Enter the room code and select your device role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          {!isConnected && (
            <div className="flex items-center justify-center space-x-2 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Connecting to server...</span>
            </div>
          )}

          {/* Room Code Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Room Code</label>
            <input
              type="text"
              value={roomCode}
              onChange={handleRoomCodeChange}
              placeholder="ABC123"
              className="w-full px-4 py-3 text-2xl font-mono tracking-wider text-center uppercase rounded-lg border-2 border-border focus:border-primary focus:outline-none bg-background"
              maxLength={6}
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center">
              Enter the 6-character code from the host
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Device Role</label>
            <div className="space-y-2">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.value;
                
                return (
                  <button
                    key={role.value}
                    onClick={() => setSelectedRole(role.value)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? `${role.color} scale-[1.02]`
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${
                        isSelected ? '' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium">{role.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {role.description}
                        </div>
                        {role.value === 'stage' && (
                          <div className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                            ⚠️ Requires file upload
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Upload for Stage Role */}
          {selectedRole === 'stage' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Presentation</label>
              {!uploadedFile ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors bg-background">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="mb-1 text-sm text-foreground">
                      <span className="font-semibold">Click to upload</span>
                    </p>
                    <p className="text-xs text-muted-foreground">PDF or PPTX (Max 50MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between p-4 border-2 border-primary rounded-lg bg-primary/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Join Button */}
          <Button
            onClick={handleJoinRoom}
            disabled={!selectedRole || !isValidRoomCode(roomCode) || !isConnected || isJoining || (selectedRole === 'stage' && !uploadedFile)}
            className="w-full"
            size="lg"
          >
            {isJoining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Room'
            )}
          </Button>

          {/* Back Link */}
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="w-full"
          >
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JoinRoomPage() {
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
