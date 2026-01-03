import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Room storage
const rooms = new Map<string, Set<string>>();
const deviceRoles = new Map<string, { role: 'stage' | 'remote' | 'teleprompter', name: string }>();
const roomSlideStates = new Map<string, number>();

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
      roomSlideStates.set(roomId, 1); // Default to slide 1
    }
    rooms.get(roomId)?.add(socket.id);

    // Get connected devices in room
    const connectedDevices = Array.from(rooms.get(roomId) || [])
      .map(id => ({
        id,
        ...deviceRoles.get(id),
      }))
      .filter(d => d.role);

    // Notify all devices in room about new connection
    io.to(roomId).emit('room-updated', {
      roomId,
      devices: connectedDevices,
      totalDevices: connectedDevices.length,
    });

    // Send current slide state to newly joined device
    const currentSlide = roomSlideStates.get(roomId) || 1;
    socket.emit('slide-sync', { slideIndex: currentSlide, roomId });

    console.log(`[Room] Room ${roomId} now has ${connectedDevices.length} device(s)`);
  });

  // Handle slide changes
  socket.on('slide-change', ({ roomId, slideIndex }) => {
    console.log(`[Slide] ${socket.id} changed to slide ${slideIndex} in room ${roomId}`);
    
    // Update room state
    roomSlideStates.set(roomId, slideIndex);
    
    // Broadcast to all devices in room
    io.to(roomId).emit('slide-sync', { slideIndex, roomId, sourceId: socket.id });
  });

  // Handle annotation data
  socket.on('annotation-data', ({ roomId, slideId, stroke }) => {
    console.log(`[Annotation] Received from ${socket.id} in room ${roomId}`);
    
    // Broadcast to all other devices in room
    socket.to(roomId).emit('annotation-received', {
      slideId,
      stroke,
      sourceId: socket.id,
    });
  });

  // Handle clear annotations
  socket.on('clear-annotations', ({ roomId, slideId }) => {
    console.log(`[Annotation] Clear request for slide ${slideId} in room ${roomId}`);
    
    io.to(roomId).emit('annotations-cleared', { slideId, roomId });
  });

  // Handle device role updates
  socket.on('update-role', ({ roomId, role, deviceName }) => {
    console.log(`[Role] ${socket.id} updated role to ${role}`);
    
    deviceRoles.set(socket.id, { role, name: deviceName || 'Unknown Device' });
    
    const connectedDevices = Array.from(rooms.get(roomId) || [])
      .map(id => ({
        id,
        ...deviceRoles.get(id),
      }))
      .filter(d => d.role);

    io.to(roomId).emit('room-updated', {
      roomId,
      devices: connectedDevices,
      totalDevices: connectedDevices.length,
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    
    // Find and remove from all rooms
    rooms.forEach((deviceSet, roomId) => {
      if (deviceSet.has(socket.id)) {
        deviceSet.delete(socket.id);
        
        // Clean up empty rooms
        if (deviceSet.size === 0) {
          rooms.delete(roomId);
          roomSlideStates.delete(roomId);
          console.log(`[Room] Room ${roomId} deleted (empty)`);
        } else {
          // Notify remaining devices
          const connectedDevices = Array.from(deviceSet)
            .map(id => ({
              id,
              ...deviceRoles.get(id),
            }))
            .filter(d => d.role);

          io.to(roomId).emit('room-updated', {
            roomId,
            devices: connectedDevices,
            totalDevices: connectedDevices.length,
          });
        }
      }
    });
    
    // Clean up device role
    deviceRoles.delete(socket.id);
  });

  // Handle explicit leave
  socket.on('leave-room', ({ roomId }) => {
    console.log(`[Room] ${socket.id} leaving room ${roomId}`);
    
    socket.leave(roomId);
    
    const deviceSet = rooms.get(roomId);
    if (deviceSet) {
      deviceSet.delete(socket.id);
      
      if (deviceSet.size === 0) {
        rooms.delete(roomId);
        roomSlideStates.delete(roomId);
      } else {
        const connectedDevices = Array.from(deviceSet)
          .map(id => ({
            id,
            ...deviceRoles.get(id),
          }))
          .filter(d => d.role);

        io.to(roomId).emit('room-updated', {
          roomId,
          devices: connectedDevices,
          totalDevices: connectedDevices.length,
        });
      }
    }
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`[Socket.io] Server running on port ${PORT}`);
});
