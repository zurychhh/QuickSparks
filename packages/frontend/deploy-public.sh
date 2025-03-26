#!/bin/bash

# This script deploys a public version of the PDFSpark application to Vercel

# Build the application
echo "🔨 Building the application..."
npm run build

# Create a deployment directory
echo "📁 Creating deployment directory..."
rm -rf public-deploy
mkdir -p public-deploy

# Copy the build files
echo "📋 Copying build files..."
cp -r dist/* public-deploy/

# Create a minimal package.json for Vercel
echo "📝 Creating package.json..."
cat > public-deploy/package.json << EOF
{
  "name": "pdfspark-public",
  "version": "1.0.0",
  "private": false,
  "scripts": {
    "vercel-build": "echo 'Static deployment, no build needed'"
  }
}
EOF

# Create the vercel.json configuration
echo "🔧 Creating vercel.json..."
cat > public-deploy/vercel.json << EOF
{
  "version": 2,
  "public": true,
  "cleanUrls": true
}
EOF

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
cd public-deploy
vercel deploy --prod --yes

echo "✅ Deployment completed!"