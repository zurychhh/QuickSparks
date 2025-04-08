#!/bin/bash

# Start services and run complete test suite
echo "🚀 Starting development servers and running complete test suite..."

# Start frontend in the background
echo "Starting frontend server..."
cd /Users/user/conversion-microservices/packages/frontend
npm run dev &
FRONTEND_PID=$!

# Give the server time to start
echo "Waiting for frontend to start..."
sleep 10

# Run the complete test suite
echo "Running complete Selenium test suite..."
node selenium-tests/complete-test.mjs

# Capture the test result
TEST_RESULT=$?

# Kill the frontend process
echo "Cleaning up processes..."
kill $FRONTEND_PID

# Wait for processes to terminate
sleep 2

echo "Test execution complete with exit code: $TEST_RESULT"
exit $TEST_RESULT