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
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    // Initialize socket only in browser
    if (typeof window === 'undefined') return;

    // Create socket connection
    const socket = io('http://localhost:3001', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
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
  };
}
