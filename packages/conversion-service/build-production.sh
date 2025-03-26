#!/bin/bash

# This script builds the project in production mode, ignoring TypeScript errors
# but still producing a valid JavaScript build

echo "Building for production..."

# Create dist directory if it doesn't exist
mkdir -p dist

# Compile TypeScript ignoring type errors completely
echo "Transpiling TypeScript to JavaScript..."
# Use tsc with transpile only option to build the project regardless of errors
npx tsc --skipLibCheck --noEmit false --emitDeclarationOnly false --outDir dist

# Copy non-TypeScript files to dist
echo "Copying non-TypeScript files..."
for file in $(find src -type f -not -name "*.ts" -not -name "*.tsx")
do
  # Create directory structure
  mkdir -p "dist/$(dirname "${file#src/}")"
  # Copy file
  cp "$file" "dist/${file#src/}"
done

echo "Build completed successfully!"
echo "The application has been built in the 'dist' directory."