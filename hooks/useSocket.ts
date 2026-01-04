'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  DeviceRole,
  JoinRoomPayload,
  SlideChangePayload,
  SlideSyncPayload,
  AnnotationDataPayload,
  AnnotationReceivedPayload,
  ClearAnnotationsPayload,
  AnnotationsClearedPayload,
  RoomUpdatedPayload,
  UpdateRolePayload,
  LeaveRoomPayload,
} from '@/types/room';

interface UseSocketOptions {
  onSlideSync?: (data: SlideSyncPayload) => void;
  onAnnotationReceived?: (data: AnnotationReceivedPayload) => void;
  onAnnotationsCleared?: (data: AnnotationsClearedPayload) => void;
  onRoomUpdated?: (data: RoomUpdatedPayload) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onReconnecting?: () => void;
  onFullscreenSync?: (data: { isFullscreen: boolean; roomId: string }) => void;
  onPlaySync?: (data: { isPlaying: boolean; roomId: string }) => void;
  onGridSync?: (data: { showGrid: boolean; roomId: string }) => void;
  onPrivacySync?: (data: { isPrivacyMode: boolean; roomId: string }) => void;
  onTimerSync?: (data: { timerState: any; roomId: string }) => void;
}

// Get Socket.io server URL dynamically based on environment
function getSocketURL(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:3001';
  }
  
  // Check for production environment variable
  const envSocketURL = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (envSocketURL) {
    console.log('[Socket] Using environment URL:', envSocketURL);
    return envSocketURL;
  }
  
  // Development: Use the same host as the current page but on port 3001
  // This allows mobile devices to connect via IP address
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const hostname = window.location.hostname;
  
  // Always use port 3001 for Socket.io server in development
  return `${protocol}//${hostname}:3001`;
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    // Initialize socket only in browser
    if (typeof window === 'undefined') return;

    const socketURL = getSocketURL();
    console.log('[Socket] Connecting to:', socketURL);

    // Create socket connection with production-ready options
    const socket = io(socketURL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],  // Prefer websocket, fallback to polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
      autoConnect: true,
      forceNew: false,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setIsConnected(true);
      setIsReconnecting(false);
      options.onConnected?.();
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
      options.onDisconnected?.();
    });

    socket.on('reconnect_attempt', () => {
      console.log('[Socket] Reconnecting...');
      setIsReconnecting(true);
      options.onReconnecting?.();
    });

    socket.on('reconnect', () => {
      console.log('[Socket] Reconnected');
      setIsReconnecting(false);
      options.onConnected?.();
    });

    socket.on('reconnect_error', (error) => {
      console.error('[Socket] Reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed');
      setIsReconnecting(false);
    });

    // Room events
    socket.on('slide-sync', (data: SlideSyncPayload) => {
      console.log('[Socket] Slide sync:', data);
      options.onSlideSync?.(data);
    });

    socket.on('annotation-received', (data: AnnotationReceivedPayload) => {
      console.log('[Socket] Annotation received');
      options.onAnnotationReceived?.(data);
    });

    socket.on('annotations-cleared', (data: AnnotationsClearedPayload) => {
      console.log('[Socket] Annotations cleared:', data);
      options.onAnnotationsCleared?.(data);
    });

    socket.on('room-updated', (data: RoomUpdatedPayload) => {
      console.log('[Socket] Room updated:', data);
      options.onRoomUpdated?.(data);
    });

    // Presentation control events
    socket.on('fullscreen-sync', (data) => {
      console.log('[Socket] Fullscreen sync:', data);
      options.onFullscreenSync?.(data);
    });

    socket.on('play-sync', (data) => {
      console.log('[Socket] Play sync:', data);
      options.onPlaySync?.(data);
    });

    socket.on('grid-sync', (data) => {
      console.log('[Socket] Grid sync:', data);
      options.onGridSync?.(data);
    });

    socket.on('privacy-sync', (data) => {
      console.log('[Socket] Privacy sync:', data);
      options.onPrivacySync?.(data);
    });

    socket.on('timer-sync', (data) => {
      console.log('[Socket] Timer sync:', data);
      options.onTimerSync?.(data);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // Empty dependency array - initialize once

  // Join a room
  const joinRoom = useCallback((payload: JoinRoomPayload) => {
    if (!socketRef.current?.connected) {
      console.warn('[Socket] Cannot join room - not connected');
      return;
    }

    console.log('[Socket] Joining room:', payload);
    socketRef.current.emit('join-room', payload);
  }, []);

  // Leave a room
  const leaveRoom = useCallback((payload: LeaveRoomPayload) => {
    if (!socketRef.current) return;

    console.log('[Socket] Leaving room:', payload);
    socketRef.current.emit('leave-room', payload);
  }, []);

  // Change slide
  const changeSlide = useCallback((payload: SlideChangePayload) => {
    if (!socketRef.current?.connected) {
      console.warn('[Socket] Cannot change slide - not connected');
      return;
    }

    console.log('[Socket] Changing slide:', payload);
    socketRef.current.emit('slide-change', payload);
  }, []);

  // Send annotation data
  const sendAnnotation = useCallback((payload: AnnotationDataPayload) => {
    if (!socketRef.current?.connected) {
      console.warn('[Socket] Cannot send annotation - not connected');
      return;
    }

    socketRef.current.emit('annotation-data', payload);
  }, []);

  // Clear annotations
  const clearAnnotations = useCallback((payload: ClearAnnotationsPayload) => {
    if (!socketRef.current?.connected) {
      console.warn('[Socket] Cannot clear annotations - not connected');
      return;
    }

    console.log('[Socket] Clearing annotations:', payload);
    socketRef.current.emit('clear-annotations', payload);
  }, []);

  // Update device role
  const updateRole = useCallback((payload: UpdateRolePayload) => {
    if (!socketRef.current?.connected) {
      console.warn('[Socket] Cannot update role - not connected');
      return;
    }

    console.log('[Socket] Updating role:', payload);
    socketRef.current.emit('update-role', payload);
  }, []);

  // Presentation controls
  const toggleFullscreen = useCallback((roomId: string, isFullscreen: boolean) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('toggle-fullscreen', { roomId, isFullscreen });
  }, []);

  const togglePlay = useCallback((roomId: string, isPlaying: boolean) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('toggle-play', { roomId, isPlaying });
  }, []);

  const toggleGrid = useCallback((roomId: string, showGrid: boolean) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('toggle-grid', { roomId, showGrid });
  }, []);

  const togglePrivacy = useCallback((roomId: string, isPrivacyMode: boolean) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('toggle-privacy', { roomId, isPrivacyMode });
  }, []);

  const updateTimer = useCallback((roomId: string, timerState: any) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('timer-update', { roomId, timerState });
  }, []);

  const timerTick = useCallback((roomId: string, remaining: number) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('timer-tick', { roomId, remaining });
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    isReconnecting,
    joinRoom,
    leaveRoom,
    changeSlide,
    sendAnnotation,
    clearAnnotations,
    updateRole,
    toggleFullscreen,
    togglePlay,
    toggleGrid,
    togglePrivacy,
    updateTimer,
    timerTick,
  };
}
