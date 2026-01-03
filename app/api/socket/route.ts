import { createServer } from 'http';
import { Server } from 'socket.io';
import { NextResponse } from 'next/server';

// Room storage
const rooms = new Map<string, Set<string>>();
const deviceRoles = new Map<string, { role: 'stage' | 'remote' | 'teleprompter', name: string }>();
const roomSlideStates = new Map<string, number>();

let io: Server | null = null;

function initSocketServer() {
  if (io) return io;

  const httpServer = createServer();
  
  io = new Server(httpServer, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Handle room joining
    socket.on('join-room', ({ roomId, role, deviceName }) => {
      console.log(`[Room] ${socket.id} joining room ${roomId} as ${role}`);
      
      socket.join(roomId);
      
      // Store device role
      deviceRoles.set(socket.id, { role, name: deviceName || 'Unknown Device' });
      
      // Add to room set
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
        roomSlideStates.set(roomId, 1);
      }
      rooms.get(roomId)?.add(socket.id);

      // Get connected devices in room
      const connectedDevices = Array.from(rooms.get(roomId) || [])
        .map(id => ({
          id,
          ...deviceRoles.get(id),
        }))
        .filter(d => d.role);

      // Notify all devices in room
      io?.to(roomId).emit('room-updated', {
        roomId,
        devices: connectedDevices,
        totalDevices: connectedDevices.length,
      });

      // Send current slide state
      const currentSlide = roomSlideStates.get(roomId) || 1;
      socket.emit('slide-sync', { slideIndex: currentSlide, roomId });
    });

    // Handle slide changes
    socket.on('slide-change', ({ roomId, slideIndex }) => {
      console.log(`[Slide] ${socket.id} changed to slide ${slideIndex}`);
      roomSlideStates.set(roomId, slideIndex);
      io?.to(roomId).emit('slide-sync', { slideIndex, roomId, sourceId: socket.id });
    });

    // Handle annotations
    socket.on('annotation-data', ({ roomId, slideId, stroke }) => {
      socket.to(roomId).emit('annotation-received', { slideId, stroke, sourceId: socket.id });
    });

    socket.on('clear-annotations', ({ roomId, slideId }) => {
      io?.to(roomId).emit('annotations-cleared', { slideId, roomId });
    });

    // Handle role updates
    socket.on('update-role', ({ roomId, role, deviceName }) => {
      deviceRoles.set(socket.id, { role, name: deviceName });
      
      const connectedDevices = Array.from(rooms.get(roomId) || [])
        .map(id => ({ id, ...deviceRoles.get(id) }))
        .filter(d => d.role);

      io?.to(roomId).emit('room-updated', {
        roomId,
        devices: connectedDevices,
        totalDevices: connectedDevices.length,
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      
      rooms.forEach((deviceSet, roomId) => {
        if (deviceSet.has(socket.id)) {
          deviceSet.delete(socket.id);
          
          if (deviceSet.size === 0) {
            rooms.delete(roomId);
            roomSlideStates.delete(roomId);
          } else {
            const connectedDevices = Array.from(deviceSet)
              .map(id => ({ id, ...deviceRoles.get(id) }))
              .filter(d => d.role);

            io?.to(roomId).emit('room-updated', {
              roomId,
              devices: connectedDevices,
              totalDevices: connectedDevices.length,
            });
          }
        }
      });
      
      deviceRoles.delete(socket.id);
    });

    socket.on('leave-room', ({ roomId }) => {
      socket.leave(roomId);
      const deviceSet = rooms.get(roomId);
      
      if (deviceSet) {
        deviceSet.delete(socket.id);
        
        if (deviceSet.size === 0) {
          rooms.delete(roomId);
          roomSlideStates.delete(roomId);
        } else {
          const connectedDevices = Array.from(deviceSet)
            .map(id => ({ id, ...deviceRoles.get(id) }))
            .filter(d => d.role);

          io?.to(roomId).emit('room-updated', {
            roomId,
            devices: connectedDevices,
            totalDevices: connectedDevices.length,
          });
        }
      }
    });
  });

  // Start listening on a port
  const port = 3001;
  httpServer.listen(port, () => {
    console.log(`[Socket.io] Server running on port ${port}`);
  });

  return io;
}

export async function GET() {
  if (!io) {
    initSocketServer();
  }
  
  return NextResponse.json({ status: 'Socket.io server running', connected: io?.engine.clientsCount || 0 });
}
