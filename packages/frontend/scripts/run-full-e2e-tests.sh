#!/bin/bash

# Full End-to-End Test Runner
# This script runs both frontend and backend services and executes all end-to-end tests

# Colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PDFSpark Full End-to-End Test Runner${NC}"
echo -e "${BLUE}========================================${NC}"

# Initialize variables
FRONTEND_PID=""
BACKEND_PID=""
TEST_RESULT=0

# Function to clean up processes
cleanup() {
  echo -e "\n${YELLOW}Cleaning up processes...${NC}"
  
  if [ ! -z "$FRONTEND_PID" ]; then
    echo "Stopping frontend server (PID: $FRONTEND_PID)"
    kill $FRONTEND_PID 2>/dev/null
  fi
  
  if [ ! -z "$BACKEND_PID" ]; then
    echo "Stopping backend server (PID: $BACKEND_PID)"
    kill $BACKEND_PID 2>/dev/null
  fi
  
  echo -e "${GREEN}Cleanup completed${NC}"
  exit $TEST_RESULT
}

# Set up cleanup on exit
trap cleanup EXIT INT TERM

# Create a screenshots directory if it doesn't exist
mkdir -p screenshots

# Check if the conversion service directory exists
CONVERSION_SERVICE_DIR="../conversion-service"
if [ ! -d "$CONVERSION_SERVICE_DIR" ]; then
  echo -e "${RED}Conversion service directory not found at: $CONVERSION_SERVICE_DIR${NC}"
  echo -e "${YELLOW}Continuing with frontend tests only${NC}"
else
  # Start the backend service
  echo -e "\n${YELLOW}Starting conversion service...${NC}"
  cd "$CONVERSION_SERVICE_DIR" && npm run dev &
  BACKEND_PID=$!
  echo "Backend service started with PID: $BACKEND_PID"
  
  # Give the backend service time to start
  echo "Waiting for backend service to initialize..."
  sleep 10
fi

# Return to frontend directory
cd "$(dirname "$0")/.."

# Start the frontend server
echo -e "\n${YELLOW}Starting frontend server...${NC}"
npm run dev &
FRONTEND_PID=$!
echo "Frontend server started with PID: $FRONTEND_PID"

# Give the frontend server time to start
echo "Waiting for frontend server to initialize..."
sleep 10

# Run frontend-only tests
echo -e "\n${YELLOW}Running frontend tests with mock mode...${NC}"
npm run test:selenium:simple

# Store the result of the first test
FRONTEND_RESULT=$?

# Update the overall test result
if [ $FRONTEND_RESULT -ne 0 ]; then
  TEST_RESULT=1
fi

# Run backend integration tests if backend is available
if [ ! -z "$BACKEND_PID" ]; then
  echo -e "\n${YELLOW}Running backend integration tests...${NC}"
  npm run test:selenium:backend
  
  # Store the result of the backend test
  BACKEND_RESULT=$?
  
  # Update the overall test result
  if [ $BACKEND_RESULT -ne 0 ]; then
    TEST_RESULT=1
  fi
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Test Run Summary${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "Frontend Tests: $([ $FRONTEND_RESULT -eq 0 ] && echo "${GREEN}PASSED${NC}" || echo "${RED}FAILED${NC}")"

if [ ! -z "$BACKEND_PID" ]; then
  echo -e "Backend Tests: $([ $BACKEND_RESULT -eq 0 ] && echo "${GREEN}PASSED${NC}" || echo "${RED}FAILED${NC}")"
fi

echo -e "${BLUE}========================================${NC}"

# Exit with the appropriate status
exit $TEST_RESULT