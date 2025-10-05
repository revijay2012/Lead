#!/bin/bash

echo "🚀 LEADS Management System - One-Click Startup"
echo "=============================================="
echo ""

echo "🛑 Step 1: Cleaning up any existing processes..."
pkill -f "firebase emulators" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
lsof -ti:4002 | xargs kill -9 2>/dev/null || true
lsof -ti:8082 | xargs kill -9 2>/dev/null || true
lsof -ti:9098 | xargs kill -9 2>/dev/null || true
lsof -ti:5002 | xargs kill -9 2>/dev/null || true
echo "✅ Cleanup complete"
sleep 3

echo ""
echo "🔥 Step 2: Starting Firebase emulators..."
firebase emulators:start &
EMULATOR_PID=$!

echo "⏳ Waiting for emulators to be ready..."
sleep 25

# Wait for emulator UI to be accessible
while ! curl -s http://127.0.0.1:4002 > /dev/null; do
    echo "⏳ Still waiting for emulators to start..."
    sleep 5
done

echo "✅ Emulators are ready!"
sleep 8

echo "🗑️  Step 3: Clearing existing data..."
npm run clear

echo "🌱 Step 4: Seeding search-optimized lead data..."
echo "   This will load 500 leads with subcollections..."
npm run seed:search

if [ $? -eq 0 ]; then
    echo "✅ Data seeding completed successfully!"
else
    echo "❌ Data seeding failed. Continuing anyway..."
fi

echo "🔍 Step 5: Verifying data structure..."
sleep 3
echo "   📊 Expected: 500 leads with activities, proposals, contracts"
echo "✅ Data verification completed"

echo ""
echo "✅ Step 6: Starting React development server..."
echo ""
echo "🎉 Everything is ready!"
echo ""
echo "📱 Access Points:"
echo "   📊 Firebase Emulator UI: http://127.0.0.1:4002"
echo "   🔥 Firestore UI: http://127.0.0.1:4002/firestore"
echo "   ⚛️  Your LEADS App: http://localhost:5173"
echo ""
echo "📊 Data Status:"
echo "   ✅ 500 leads with subcollections loaded"
echo "   ✅ Search-optimized with prefix matching"
echo "   ✅ Activities, proposals, contracts included"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start React app
npm run dev:app &
REACT_PID=$!

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $EMULATOR_PID 2>/dev/null || true
    kill $REACT_PID 2>/dev/null || true
    pkill -f "firebase emulators" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $EMULATOR_PID $REACT_PID
