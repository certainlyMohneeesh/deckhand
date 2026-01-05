'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { RoomState, DeviceRole, ConnectedDevice } from '@/types/room';
import { createRoomCode, getDeviceName } from '@/lib/room';
import { toast } from 'sonner';

interface RoomContextValue extends RoomState {
  // Room management
  createRoom: (role: DeviceRole) => string;
  joinRoom: (roomId: string, role: DeviceRole) => void;
  leaveRoom: () => void;

  // Slide control
  goToSlide: (slideIndex: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  setTotalSlides: (total: number) => void;

  // Device management
  updateDeviceName: (name: string) => void;

  // Connection status
  isReconnecting: boolean;

  // Presentation controls
  toggleFullscreen: (isFullscreen: boolean) => void;
  togglePlay: (isPlaying: boolean) => void;
  toggleGrid: (showGrid: boolean) => void;
  togglePrivacy: (isPrivacyMode: boolean) => void;
  updateTimer: (timerState: any) => void;
  timerTick: (remaining: number) => void;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within RoomProvider');
  }
  return context;
}

interface RoomProviderProps {
  children: React.ReactNode;
}

export function RoomProvider({ children }: RoomProviderProps) {
  const [roomState, setRoomState] = useState<RoomState>({
    roomId: null,
    isHost: false,
    role: null,
    deviceName: getDeviceName(),
    connectedDevices: [],
    currentSlide: 1,
    totalSlides: 0,
    isConnected: false,
    isFullscreen: false,
    isPlaying: false,
    showGrid: false,
    isPrivacyMode: false,
  });

  // Socket connection with event handlers
  const {
    isConnected,
    isReconnecting,
    joinRoom: socketJoinRoom,
    leaveRoom: socketLeaveRoom,
    changeSlide,
    sendAnnotation,
    clearAnnotations,
    updateRole,
    toggleFullscreen: socketToggleFullscreen,
    togglePlay: socketTogglePlay,
    toggleGrid: socketToggleGrid,
    togglePrivacy: socketTogglePrivacy,
    updateTimer: socketUpdateTimer,
    timerTick: socketTimerTick,
  } = useSocket({
    onConnected: () => {
      setRoomState(prev => ({ ...prev, isConnected: true }));
      toast.success('Connected to server');
    },
    onDisconnected: () => {
      setRoomState(prev => ({ ...prev, isConnected: false }));
      toast.error('Disconnected from server');
    },
    onReconnecting: () => {
      toast.loading('Reconnecting...', { id: 'reconnecting' });
    },
    onSlideSync: (data) => {
      // Update slide index and totalSlides from server
      setRoomState(prev => ({
        ...prev,
        currentSlide: data.slideIndex,
        // Update totalSlides if provided by server (from stage)
        totalSlides: data.totalSlides !== undefined && data.totalSlides > 0
          ? data.totalSlides
          : prev.totalSlides,
      }));
    },
    onRoomUpdated: (data) => {
      setRoomState(prev => ({
        ...prev,
        connectedDevices: data.devices,
        // Sync totalSlides if provided
        totalSlides: data.totalSlides !== undefined && data.totalSlides > 0
          ? data.totalSlides
          : prev.totalSlides,
      }));
    },
    // Feature 1: Control sync handlers
    onFullscreenSync: (data) => {
      console.log('[RoomContext] Fullscreen sync:', data.isFullscreen);
      setRoomState(prev => ({ ...prev, isFullscreen: data.isFullscreen }));
    },
    onPlaySync: (data) => {
      console.log('[RoomContext] Play sync:', data.isPlaying);
      setRoomState(prev => ({ ...prev, isPlaying: data.isPlaying }));
    },
    onGridSync: (data) => {
      console.log('[RoomContext] Grid sync:', data.showGrid);
      setRoomState(prev => ({ ...prev, showGrid: data.showGrid }));
    },
    // Feature 2: Privacy mode sync handler
    onPrivacySync: (data) => {
      console.log('[RoomContext] Privacy sync:', data.isPrivacyMode);
      setRoomState(prev => ({ ...prev, isPrivacyMode: data.isPrivacyMode }));
    },
  });

  // Create a new room (host)
  const createRoom = useCallback((role: DeviceRole): string => {
    const newRoomId = createRoomCode();

    setRoomState(prev => ({
      ...prev,
      roomId: newRoomId,
      isHost: true,
      role,
      currentSlide: 1,
    }));

    // Join the room via socket
    if (isConnected) {
      socketJoinRoom({
        roomId: newRoomId,
        role,
        deviceName: roomState.deviceName,
      });
    }

    toast.success(`Room created: ${newRoomId}`);
    return newRoomId;
  }, [isConnected, socketJoinRoom, roomState.deviceName]);

  // Join an existing room
  const joinRoom = useCallback((roomId: string, role: DeviceRole) => {
    setRoomState(prev => ({
      ...prev,
      roomId,
      isHost: false,
      role,
      currentSlide: 1,
    }));

    if (isConnected) {
      socketJoinRoom({
        roomId,
        role,
        deviceName: roomState.deviceName,
      });
      toast.success(`Joined room: ${roomId}`);
    } else {
      toast.error('Not connected to server');
    }
  }, [isConnected, socketJoinRoom, roomState.deviceName]);

  // Leave current room
  const leaveRoom = useCallback(() => {
    if (roomState.roomId) {
      socketLeaveRoom({ roomId: roomState.roomId });

      setRoomState({
        roomId: null,
        isHost: false,
        role: null,
        deviceName: roomState.deviceName,
        connectedDevices: [],
        currentSlide: 1,
        totalSlides: 0,
        isConnected,
        isFullscreen: false,
        isPlaying: false,
        showGrid: false,
        isPrivacyMode: false,
      });

      toast.info('Left room');
    }
  }, [roomState.roomId, roomState.deviceName, socketLeaveRoom, isConnected]);

  // Navigate to specific slide
  const goToSlide = useCallback((slideIndex: number) => {
    if (!roomState.roomId) return;

    // Clamp to valid range
    const clampedIndex = Math.max(1, Math.min(slideIndex, roomState.totalSlides || slideIndex));

    setRoomState(prev => ({
      ...prev,
      currentSlide: clampedIndex,
    }));

    changeSlide({
      roomId: roomState.roomId,
      slideIndex: clampedIndex,
      totalSlides: roomState.totalSlides,  // Always include totalSlides for sync
    });
  }, [roomState.roomId, roomState.totalSlides, changeSlide]);

  // Next slide
  const nextSlide = useCallback(() => {
    if (roomState.currentSlide < (roomState.totalSlides || Infinity)) {
      goToSlide(roomState.currentSlide + 1);
    }
  }, [roomState.currentSlide, roomState.totalSlides, goToSlide]);

  // Previous slide
  const prevSlide = useCallback(() => {
    if (roomState.currentSlide > 1) {
      goToSlide(roomState.currentSlide - 1);
    }
  }, [roomState.currentSlide, goToSlide]);

  // Set total slides and broadcast to room
  const setTotalSlides = useCallback((total: number) => {
    setRoomState(prev => ({
      ...prev,
      totalSlides: total,
    }));

    // Broadcast totalSlides to all connected devices immediately
    // This ensures remotes get the correct totalSlides when they join
    if (roomState.roomId && total > 0) {
      changeSlide({
        roomId: roomState.roomId,
        slideIndex: roomState.currentSlide,
        totalSlides: total,
      });
    }
  }, [roomState.roomId, roomState.currentSlide, changeSlide]);

  // Update device name
  const updateDeviceName = useCallback((name: string) => {
    setRoomState(prev => ({
      ...prev,
      deviceName: name,
    }));

    // Update on server if in a room
    if (roomState.roomId && roomState.role) {
      updateRole({
        roomId: roomState.roomId,
        role: roomState.role,
        deviceName: name,
      });
    }
  }, [roomState.roomId, roomState.role, updateRole]);

  // Presentation control wrappers
  const toggleFullscreen = useCallback((isFullscreen: boolean) => {
    if (roomState.roomId) {
      socketToggleFullscreen(roomState.roomId, isFullscreen);
    }
  }, [roomState.roomId, socketToggleFullscreen]);

  const togglePlay = useCallback((isPlaying: boolean) => {
    if (roomState.roomId) {
      socketTogglePlay(roomState.roomId, isPlaying);
    }
  }, [roomState.roomId, socketTogglePlay]);

  const toggleGrid = useCallback((showGrid: boolean) => {
    if (roomState.roomId) {
      socketToggleGrid(roomState.roomId, showGrid);
    }
  }, [roomState.roomId, socketToggleGrid]);

  const togglePrivacy = useCallback((isPrivacyMode: boolean) => {
    if (roomState.roomId) {
      socketTogglePrivacy(roomState.roomId, isPrivacyMode);
    }
  }, [roomState.roomId, socketTogglePrivacy]);

  const updateTimer = useCallback((timerState: any) => {
    if (roomState.roomId) {
      socketUpdateTimer(roomState.roomId, timerState);
    }
  }, [roomState.roomId, socketUpdateTimer]);

  const timerTick = useCallback((remaining: number) => {
    if (roomState.roomId) {
      socketTimerTick(roomState.roomId, remaining);
    }
  }, [roomState.roomId, socketTimerTick]);

  // Auto-rejoin room on reconnection
  useEffect(() => {
    if (isConnected && roomState.roomId && roomState.role && !isReconnecting) {
      // Rejoin the room after reconnection
      const timer = setTimeout(() => {
        socketJoinRoom({
          roomId: roomState.roomId!,
          role: roomState.role!,
          deviceName: roomState.deviceName,
        });
        toast.dismiss('reconnecting');
        toast.success('Reconnected to room');
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isConnected, roomState.roomId, roomState.role, roomState.deviceName, isReconnecting, socketJoinRoom]);

  const contextValue: RoomContextValue = {
    ...roomState,
    isReconnecting,
    createRoom,
    joinRoom,
    leaveRoom,
    goToSlide,
    nextSlide,
    prevSlide,
    setTotalSlides,
    updateDeviceName,
    toggleFullscreen,
    togglePlay,
    toggleGrid,
    togglePrivacy,
    updateTimer,
    timerTick,
  };

  return (
    <RoomContext.Provider value={contextValue}>
      {children}
    </RoomContext.Provider>
  );
}
