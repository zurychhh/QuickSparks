#!/bin/bash

# Start services and run tests
echo "🚀 Starting development servers and running tests..."

# Start frontend in the background
echo "Starting frontend server..."
cd /Users/user/conversion-microservices/packages/frontend
npm run dev &
FRONTEND_PID=$!

# Give the server time to start
echo "Waiting for frontend to start..."
sleep 10

# Run the tests
echo "Running Selenium tests..."
node selenium-tests/direct-test.mjs

# Capture the test result
TEST_RESULT=$?

# Kill the frontend process
echo "Cleaning up processes..."
kill $FRONTEND_PID

# Wait for processes to terminate
sleep 2

echo "Test execution complete with exit code: $TEST_RESULT"
exit $TEST_RESULT