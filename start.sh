#!/bin/bash
# Cashflow Survival Agent — Local Startup Script
# Starts both backend (Express + x402) and frontend (Next.js)

set -e

echo ""
echo "=============================================="
echo "  Cashflow Survival Agent — Local Deploy"
echo "  x402 Protocol on Stellar Testnet"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is required. Install from https://nodejs.org${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}Node.js:${NC} $NODE_VERSION"

# Step 1: Install frontend dependencies
echo ""
echo -e "${CYAN}[1/4] Installing frontend dependencies...${NC}"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    npm install --silent
    echo -e "${GREEN}Frontend dependencies installed.${NC}"
else
    echo -e "${GREEN}Frontend dependencies already up to date.${NC}"
fi

# Step 2: Install backend dependencies
echo ""
echo -e "${CYAN}[2/4] Installing backend dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    npm install --silent
    echo -e "${GREEN}Backend dependencies installed.${NC}"
else
    echo -e "${GREEN}Backend dependencies already up to date.${NC}"
fi

# Check .env configuration
echo ""
echo -e "${CYAN}[3/4] Checking configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: backend/.env not found.${NC}"
    echo "Create backend/.env with:"
    echo "  PAY_TO_ADDRESS=<your Stellar testnet address>"
    echo "  STELLAR_PRIVATE_KEY=<your secret key for client.js>"
    echo "  PORT=4000"
    exit 1
fi

# Source .env for display
source .env 2>/dev/null || true
echo -e "${GREEN}PAY_TO_ADDRESS:${NC} ${PAY_TO_ADDRESS:-NOT SET}"
echo -e "${GREEN}PORT:${NC} ${PORT:-4000}"

if [ -z "$PAY_TO_ADDRESS" ]; then
    echo -e "${YELLOW}Warning: PAY_TO_ADDRESS not set in backend/.env${NC}"
    echo "Generate a testnet keypair at: https://laboratory.stellar.org/#account-creator?network=test"
fi

if [ -z "$STELLAR_PRIVATE_KEY" ]; then
    echo -e "${YELLOW}Warning: STELLAR_PRIVATE_KEY not set — client.js agent won't work${NC}"
    echo "Add your Stellar secret key (S...) to backend/.env"
fi

cd ..

# Step 3: Start backend
echo ""
echo -e "${CYAN}[4/4] Starting servers...${NC}"
echo ""

# Kill any existing processes on ports
kill $(lsof -t -i:4000 2>/dev/null) 2>/dev/null || true
kill $(lsof -t -i:3000 2>/dev/null) 2>/dev/null || true

# Start backend in background
echo -e "${GREEN}Starting backend on port ${PORT:-4000}...${NC}"
cd backend
node server.js &
BACKEND_PID=$!
cd ..

# Wait for backend to initialize
sleep 3

# Check if backend started
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}Backend failed to start. Check backend/.env and try:${NC}"
    echo "  cd backend && node server.js"
    exit 1
fi

# Start frontend
echo -e "${GREEN}Starting frontend on port 3000...${NC}"
npx next dev -p 3000 &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}=============================================="
echo -e "  Both servers running!"
echo -e "  Frontend: http://localhost:3000"
echo -e "  Backend:  http://localhost:${PORT:-4000}"
echo -e "  Health:   http://localhost:${PORT:-4000}/health"
echo -e "==============================================${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Cleanup on exit
cleanup() {
    echo ""
    echo -e "${CYAN}Shutting down...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Done.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for either process to exit
wait
