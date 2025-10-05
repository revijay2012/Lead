#!/bin/bash

echo "🛑 Killing all Firebase emulator processes and conflicting services..."

# Kill Firebase emulator processes
pkill -f "firebase emulators" 2>/dev/null || true
pkill -f "firebase emulator" 2>/dev/null || true

# Kill processes using our emulator ports
echo "🔍 Checking and killing processes on emulator ports..."

# Kill processes on port 4002 (UI)
lsof -ti:4002 | xargs kill -9 2>/dev/null || true

# Kill processes on port 8082 (Firestore)
lsof -ti:8082 | xargs kill -9 2>/dev/null || true

# Kill processes on port 9098 (Auth)
lsof -ti:9098 | xargs kill -9 2>/dev/null || true

# Kill processes on port 5002 (Functions)
lsof -ti:5002 | xargs kill -9 2>/dev/null || true

# Kill processes on port 4402 (Hub)
lsof -ti:4402 | xargs kill -9 2>/dev/null || true

# Kill processes on port 4502 (Logging)
lsof -ti:4502 | xargs kill -9 2>/dev/null || true

echo "✅ All processes killed. Waiting 3 seconds..."
sleep 3

echo "🚀 Starting Firebase emulators..."
firebase emulators:start &
EMULATOR_PID=$!

echo "⏳ Waiting for emulators to be ready..."
# Wait for emulators to start
sleep 8

# Check if emulators are ready
echo "🔍 Checking if emulators are ready..."
while ! curl -s http://127.0.0.1:4002 > /dev/null; do
    echo "⏳ Still waiting for emulators to start..."
    sleep 2
done

echo "✅ Emulators are ready!"
echo "🌱 Seeding sample data..."
npm run seed:5000

echo ""
echo "🎉 Setup complete!"
echo "📊 Firebase Emulator UI: http://127.0.0.1:4002"
echo "🔥 Firestore UI: http://127.0.0.1:4002/firestore"
echo "🔥 Firestore emulator: http://127.0.0.1:8082"
echo ""
echo "⚛️  Starting React development server..."
echo "React app will be available at: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Start React app
npm run dev:app

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $EMULATOR_PID 2>/dev/null || true
    pkill -f "firebase emulators" 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for emulator process
wait $EMULATOR_PID

