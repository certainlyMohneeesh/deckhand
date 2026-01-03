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
      // Don't update if we're the source of the change
      setRoomState(prev => ({
        ...prev,
        currentSlide: data.slideIndex,
      }));
    },
    onRoomUpdated: (data) => {
      setRoomState(prev => ({
        ...prev,
        connectedDevices: data.devices,
      }));
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

  // Set total slides
  const setTotalSlides = useCallback((total: number) => {
    setRoomState(prev => ({
      ...prev,
      totalSlides: total,
    }));
  }, []);

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
  };

  return (
    <RoomContext.Provider value={contextValue}>
      {children}
    </RoomContext.Provider>
  );
}
