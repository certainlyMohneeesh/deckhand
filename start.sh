#!/bin/bash

echo "🚀 Starting DeckHand Multi-Device Presentation System..."
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📂 Working directory: $SCRIPT_DIR"
echo ""

# Kill any existing processes on these ports
echo "🧹 Cleaning up existing processes..."
# Prefer our helper stop script to gracefully stop socket server
if [ -x "$SCRIPT_DIR/../socket-server/stop-server.sh" ]; then
  echo "Stopping existing socket server (if any)..."
  "$SCRIPT_DIR/../socket-server/stop-server.sh" || true
else
  lsof -ti:3001 | xargs kill -9 2>/dev/null || true
fi
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "Starting Socket.io Server (port 3001)..."
# Use the socket-server helper to start the server and write pidfile
if [ -x "$SCRIPT_DIR/../socket-server/start-server.sh" ]; then
  "$SCRIPT_DIR/../socket-server/start-server.sh"
else
  echo "Warning: start script missing, starting server directly..."
  (cd "$SCRIPT_DIR/../socket-server" && nohup bun run server.ts > server.log 2>&1 &)
fi

# Wait for socket server to be ready (health check)
echo "Waiting for socket server to be ready..."
for i in {1..10}; do
  if curl -sS http://localhost:3001/health >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

echo "Starting Next.js Dev Server (port 3000)..."
bun run dev &
NEXT_PID=$!

# Wait for Next.js to start
sleep 5

echo ""
echo "✅ Both servers started!"
echo ""
echo "📱 Access URLs:"
echo "   Stage (Desktop): http://localhost:3000"
echo "   Join Room:       http://localhost:3000/join"
echo "   Socket.io:       http://localhost:3001"
echo ""
echo "💡 On your phone:"
echo "   1. Connect to same WiFi"
echo "   2. Upload presentation on desktop"
echo "   3. Click 'Start Presentation'"
echo "   4. Scan QR code or enter room code"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Trap Ctrl+C to gracefully stop both services (socket server via helper)
trap "echo ''; echo '🛑 Stopping servers...'; \"$SCRIPT_DIR/../socket-server/stop-server.sh\" || true; kill $NEXT_PID 2>/dev/null || true; exit" INT

# Wait for Next.js process
wait $NEXT_PID
