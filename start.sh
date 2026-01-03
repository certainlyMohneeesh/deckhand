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
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

echo "Starting Socket.io Server (port 3001)..."
bun run socket &
SOCKET_PID=$!

# Wait for socket server to start
sleep 3

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

# Trap Ctrl+C to kill both processes
trap "echo ''; echo '🛑 Stopping servers...'; kill $SOCKET_PID $NEXT_PID 2>/dev/null; exit" INT

# Wait for both processes
wait
