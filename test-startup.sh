#!/bin/bash

echo "🧪 Testing automatic startup with data seeding..."

# Kill any existing processes
pkill -f "firebase emulators" 2>/dev/null || true
lsof -ti:4002 | xargs kill -9 2>/dev/null || true
lsof -ti:8082 | xargs kill -9 2>/dev/null || true

sleep 2

echo "🔥 Starting emulators..."
firebase emulators:start --only firestore &
EMULATOR_PID=$!

echo "⏳ Waiting for emulators to start..."
sleep 10

# Check if emulators are ready
echo "🔍 Checking emulator status..."
while ! curl -s http://127.0.0.1:4002 > /dev/null; do
    echo "⏳ Still waiting..."
    sleep 2
done

echo "✅ Emulator UI is ready!"
echo "🌱 Seeding data..."
npm run seed:5000

echo "🔍 Verifying data..."
node scripts/check-data.js

echo "🧪 Test complete! Cleaning up..."
kill $EMULATOR_PID 2>/dev/null || true

