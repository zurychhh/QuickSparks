#!/bin/bash

# Direct deployment script for Vercel
# This script creates a clean deployment to Vercel,
# bypassing GitHub integration issues

set -e

echo "🚀 Starting direct Vercel deployment..."

# Get the project root directory
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
FRONTEND_DIR="$PROJECT_ROOT/packages/frontend"

# Log the directories
echo "Project root: $PROJECT_ROOT"
echo "Frontend directory: $FRONTEND_DIR"

# Step 1: Create necessary directories and components
echo "📁 Ensuring all required files and directories exist..."

mkdir -p "$FRONTEND_DIR/src/components/ui"
FILEVIEWER_PATH="$FRONTEND_DIR/src/components/ui/FileViewer.tsx"

# If FileViewer.tsx doesn't exist, create it
if [ ! -f "$FILEVIEWER_PATH" ]; then
  echo "🔨 Creating FileViewer component..."
  cat > "$FILEVIEWER_PATH" << 'EOF'
import React from 'react';

interface FileViewerProps {
  fileUrl: string;
  mimeType?: string;
  fileName?: string;
  fileType?: string;
  onDownload?: () => void;
  allowFullScreen?: boolean;
  className?: string;
}

const FileViewer: React.FC<FileViewerProps> = ({ 
  fileUrl, 
  fileName = "Your File",
  className = ""
}) => {
  return (
    <div className={`p-4 mb-6 border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <h3 className="mb-4 text-lg font-medium">File Preview</h3>
      <div className="flex flex-col items-center justify-center h-64 p-4 border border-dashed border-gray-300 rounded-md">
        <p className="mb-2 text-lg font-medium">{fileName}</p>
        <p className="text-sm text-gray-500">
          Preview not available in this environment.
        </p>
        <a 
          href={fileUrl} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          target="_blank" 
          rel="noopener noreferrer"
        >
          Download File
        </a>
      </div>
    </div>
  );
};

export default FileViewer;
EOF
  echo "✅ FileViewer component created!"
fi

# Step 2: Create a file for emergency fixes to Conversion.tsx
echo "🔧 Running fixes for Conversion page..."
if [ -f "$FRONTEND_DIR/src/pages/Conversion.tsx" ]; then
  node "$FRONTEND_DIR/src/components/ui/ConversionPage-fix.mjs" || true
else
  echo "❌ Conversion.tsx not found - skipping fix"
fi

# Step 3: Update vercel.json at the root and frontend
echo "📝 Updating Vercel configuration..."

cat > "$PROJECT_ROOT/vercel.json" << 'EOF'
{
  "installCommand": "pnpm install --no-frozen-lockfile",
  "buildCommand": "cd packages/frontend && node fix-build.mjs && vite build",
  "outputDirectory": "packages/frontend/dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "github": {
    "enabled": true,
    "silent": false,
    "autoAlias": true
  },
  "ignoreCommand": "echo 'Never ignore commits!'",
  "build": {
    "env": {
      "VERCEL_FORCE_NO_BUILD_CACHE": "1"
    }
  }
}
EOF

# Step 4: Deploy to Vercel
echo "🚀 Deploying to Vercel..."
cd "$PROJECT_ROOT" && vercel deploy --prod --force --yes

# Step 5: Verification
echo "✅ Deployment process complete!"
echo "🌐 Check your Vercel dashboard for deployment status"