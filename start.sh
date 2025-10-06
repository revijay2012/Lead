#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Lead Management System with Progressive Data Loading...${NC}"
echo -e "${BLUE}==============================================================${NC}"

# Kill any existing Firebase emulators
echo -e "${YELLOW}🔧 Stopping any existing Firebase emulators...${NC}"
pkill -f firebase || true

# Start Firebase emulators
echo -e "${GREEN}🔥 Starting Firebase emulators...${NC}"
firebase emulators:start --only firestore &
EMULATOR_PID=$!

# Wait for emulators to start
echo -e "${YELLOW}⏳ Waiting for emulators to start...${NC}"
sleep 8

# Check if emulators are running
if ! curl -s http://localhost:8080 > /dev/null; then
    echo -e "${RED}❌ Firestore emulator failed to start on port 8080${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Firebase emulators are running!${NC}"
echo -e "${BLUE}📊 Firestore Emulator: http://localhost:8080${NC}"
echo -e "${BLUE}🎛️  Emulator UI: http://localhost:4000${NC}"

# Load initial sample data (100 leads)
echo -e "${PURPLE}📊 Loading initial sample data (100 leads)...${NC}"
node scripts/seed-sample-data.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Initial sample data loaded successfully!${NC}"
else
    echo -e "${RED}❌ Failed to load sample data${NC}"
    exit 1
fi

# Start React app
echo -e "${GREEN}⚛️  Starting React development server...${NC}"
npm start &
REACT_PID=$!

# Wait for React to start
echo -e "${YELLOW}⏳ Waiting for React app to start...${NC}"
sleep 12

echo -e "${GREEN}🎉 Lead Management System is ready with initial data!${NC}"
echo -e "${BLUE}==============================================================${NC}"
echo -e "${BLUE}🌐 React App (Vite): http://localhost:5173${NC}"
echo -e "${BLUE}📊 Firestore Emulator: http://localhost:8080${NC}"
echo -e "${BLUE}🎛️  Emulator UI: http://localhost:4000${NC}"
echo ""
echo -e "${PURPLE}📈 Initial Data Loaded:${NC}"
echo -e "  • 100 leads with realistic 2024 data"
echo -e "  • 300+ activities (calls, emails, meetings, notes, tasks)"
echo -e "  • 50+ proposals (for qualified+ leads)"
echo -e "  • 10+ contracts (for closed-won leads)"
echo -e "  • Full search capabilities and drill-down reporting"
echo ""
echo -e "${YELLOW}🔄 Background seeding will start in 30 seconds...${NC}"
echo -e "${YELLOW}💡 This will gradually add more data while you use the app${NC}"

# Start background data seeding after a delay
sleep 30
echo -e "${PURPLE}🔄 Starting background data seeding...${NC}"
echo -e "${YELLOW}💡 Adding 600+ more leads gradually (50 per month × 12 months)${NC}"
node scripts/seed-background-data.js &
BACKGROUND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    kill $REACT_PID 2>/dev/null || true
    kill $BACKGROUND_PID 2>/dev/null || true
    kill $EMULATOR_PID 2>/dev/null || true
    pkill -f firebase || true
    echo -e "${GREEN}✅ All services stopped${NC}"
}

# Set trap to cleanup on script exit
trap cleanup EXIT

# Keep script running
echo -e "${BLUE}💡 Press Ctrl+C to stop all services${NC}"
echo -e "${PURPLE}📈 Background seeding will continue adding data...${NC}"
wait