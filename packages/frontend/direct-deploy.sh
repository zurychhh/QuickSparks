#!/bin/bash

# Build the application
echo "🔨 Building the application..."
npm run build

# Create a dedicated deployment directory
echo "📁 Creating deployment directory..."
rm -rf deploy-dist
mkdir -p deploy-dist

# Copy build files
echo "📋 Copying build files..."
cp -r dist/* deploy-dist/

# Create vercel.json
echo "🔧 Creating Vercel configuration..."
cat > deploy-dist/vercel.json << EOF
{
  "version": 2,
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
EOF

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
cd deploy-dist
vercel deploy --prod --yes

echo "✅ Deployment completed!"