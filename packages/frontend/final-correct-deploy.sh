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

# Create proper vercel.json with correct routing for SPA and no authentication
echo "🔧 Creating Vercel configuration..."
cat > deploy-dist/vercel.json << EOF
{
  "version": 2,
  "public": true,
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/assets/(.*)",
      "dest": "/assets/\$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
EOF

# Create a README.md for the deployment
cat > deploy-dist/README.md << EOF
# PDFSpark

PDFSpark is a document conversion service for PDF to DOCX and DOCX to PDF conversion.

## Development

This is a deployment of the PDFSpark application.
EOF

# Deploy to Vercel with a new project name to avoid conflict
echo "🚀 Deploying to Vercel..."
cd deploy-dist
vercel deploy --prod --yes --name pdfspark-production

echo "✅ Deployment completed!"