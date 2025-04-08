#!/bin/bash

# This script runs before the Docker build on Render
# to ensure the package.json and package-lock.json are in sync

echo "Running pre-build script for conversion-service..."

# Make sure we're in the right directory
cd /app/packages/conversion-service || exit 1

# Update the package-lock.json file before building
echo "Updating package-lock.json..."
npm install --package-lock-only

echo "Pre-build completed. Continuing with Docker build..."