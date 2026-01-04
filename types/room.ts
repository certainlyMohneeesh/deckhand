export type DeviceRole = 'stage' | 'remote' | 'teleprompter';

export interface ConnectedDevice {
  id: string;
  role: DeviceRole;
  name: string;
}

export interface RoomState {
  roomId: string | null;
  isHost: boolean;
  role: DeviceRole | null;
  deviceName: string;
  connectedDevices: ConnectedDevice[];
  currentSlide: number;
  totalSlides: number;
  isConnected: boolean;
  // Feature 1: Presentation control states
  isFullscreen: boolean;
  isPlaying: boolean;
  showGrid: boolean;
}

export interface AnnotationStroke {
  color: string;
  width: number;
  points: { x: number; y: number }[];
  timestamp: number;
}

// Socket.io event payloads
export interface JoinRoomPayload {
  roomId: string;
  role: DeviceRole;
  deviceName: string;
}

export interface SlideChangePayload {
  roomId: string;
  slideIndex: number;
  totalSlides?: number;
}

export interface SlideSyncPayload {
  slideIndex: number;
  roomId: string;
  sourceId?: string;
  totalSlides?: number;
  timestamp?: number;
}

export interface AnnotationDataPayload {
  roomId: string;
  slideId: string | number;
  stroke: AnnotationStroke;
}

export interface AnnotationReceivedPayload {
  slideId: string | number;
  stroke: AnnotationStroke;
  sourceId: string;
}

export interface ClearAnnotationsPayload {
  roomId: string;
  slideId: string | number;
}

export interface AnnotationsClearedPayload {
  slideId: string | number;
  roomId: string;
}

export interface RoomUpdatedPayload {
  roomId: string;
  devices: ConnectedDevice[];
  totalDevices: number;
  totalSlides?: number;
}

export interface UpdateRolePayload {
  roomId: string;
  role: DeviceRole;
  deviceName: string;
}

export interface LeaveRoomPayload {
  roomId: string;
}
