'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Users, Smartphone, Monitor, BookOpen, Copy, Check, Wifi, WifiOff } from 'lucide-react';
import { generateRoomQRCode, formatRoomCode } from '@/lib/room';
import { useRoom } from '@/contexts/RoomContext';
import { toast } from 'sonner';

export function StageControls() {
  const { 
    roomId, 
    connectedDevices, 
    isConnected, 
    isReconnecting,
    currentSlide,
    totalSlides,
  } = useRoom();
  
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate QR code when room is created
  useEffect(() => {
    if (roomId) {
      generateRoomQRCode(roomId)
        .then(setQrCodeUrl)
        .catch(err => {
          console.error('Failed to generate QR:', err);
          toast.error('Failed to generate QR code');
        });
    }
  }, [roomId]);

  const handleCopyRoomCode = async () => {
    if (!roomId) return;
    
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      toast.success('Room code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleCopyUrl = async () => {
    if (!roomId) return;
    
    const url = `${window.location.origin}/join?room=${roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Room URL copied!');
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  if (!roomId) return null;

  const remoteDevices = connectedDevices.filter(d => d.role === 'remote');
  const teleprompterDevices = connectedDevices.filter(d => d.role === 'teleprompter');

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-xs">
      {/* Connection Status */}
      <Card className="bg-background/95 backdrop-blur-sm border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isReconnecting ? (
                <WifiOff className="h-4 w-4 text-yellow-500 animate-pulse" />
              ) : isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {isReconnecting ? 'Reconnecting...' : isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {totalSlides > 0 && (
              <span className="text-xs text-muted-foreground">
                {currentSlide}/{totalSlides}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Room Code Card */}
      <Card className="bg-background/95 backdrop-blur-sm border-2 border-primary">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Room Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Room Code Display */}
          <div className="flex items-center justify-between">
            <div className="font-mono text-2xl font-bold tracking-wider">
              {formatRoomCode(roomId)}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyRoomCode}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* QR Code Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQR(!showQR)}
            className="w-full"
          >
            {showQR ? 'Hide' : 'Show'} QR Code
          </Button>

          {/* QR Code Display */}
          {showQR && qrCodeUrl && (
            <div className="mt-3 p-3 bg-white rounded-lg">
              <img
                src={qrCodeUrl}
                alt="Room QR Code"
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Copy URL Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyUrl}
            className="w-full text-xs"
          >
            Copy Join URL
          </Button>
        </CardContent>
      </Card>

      {/* Connected Devices Card */}
      <Card className="bg-background/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Connected Devices ({connectedDevices.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {connectedDevices.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No devices connected yet
            </p>
          ) : (
            <div className="space-y-2">
              {/* Stage Devices */}
              {connectedDevices.filter(d => d.role === 'stage').map(device => (
                <div
                  key={device.id}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-primary/10"
                >
                  <Monitor className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium flex-1 truncate">
                    {device.name}
                  </span>
                  <span className="text-xs text-muted-foreground">Stage</span>
                </div>
              ))}

              {/* Remote Devices */}
              {remoteDevices.map(device => (
                <div
                  key={device.id}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-blue-500/10"
                >
                  <Smartphone className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium flex-1 truncate">
                    {device.name}
                  </span>
                  <span className="text-xs text-muted-foreground">Remote</span>
                </div>
              ))}

              {/* Teleprompter Devices */}
              {teleprompterDevices.map(device => (
                <div
                  key={device.id}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-purple-500/10"
                >
                  <BookOpen className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-medium flex-1 truncate">
                    {device.name}
                  </span>
                  <span className="text-xs text-muted-foreground">Teleprompter</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
