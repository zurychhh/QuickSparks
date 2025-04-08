#!/bin/bash

# Start the backend services
cd /Users/user/conversion-microservices/packages/conversion-service
npm run dev &
BACKEND_PID=$!

# Wait for services to start
sleep 10

# Test API endpoints
echo "Testing /health endpoint..."
curl -s http://localhost:4000/health | grep -q "ok" && echo "✅ Health endpoint working" || echo "❌ Health endpoint failed"

echo "Testing /conversion/status endpoint..."
curl -s http://localhost:4000/conversion/status | grep -q "status" && echo "✅ Status endpoint working" || echo "❌ Status endpoint failed"

# Kill the backend process
kill $BACKEND_PID
sleep 2

echo "API tests completed"
