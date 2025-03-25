import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * This script creates a standalone frontend project for direct deployment to Vercel
 */
async function createStandaloneProject() {
  try {
    console.log('🚀 Creating standalone frontend project for Vercel deployment...');
    
    // Create temp directory for the standalone project
    const tempDir = path.join(__dirname, 'temp-vercel-deploy');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    fs.mkdirSync(tempDir);
    console.log(`✅ Created deployment directory: ${tempDir}`);
    
    // Copy essential frontend files
    const filesToCopy = [
      'package.json',
      'tsconfig.json',
      'index.html',
      'vite.config.ts',
      '.eslintrc.cjs',
      'fix-build.mjs'
    ];
    
    for (const file of filesToCopy) {
      if (fs.existsSync(path.join(__dirname, file))) {
        fs.copyFileSync(
          path.join(__dirname, file),
          path.join(tempDir, file)
        );
      }
    }
    
    // Create src directory and copy contents
    const srcDir = path.join(tempDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    
    function copyDirRecursively(source, target) {
      if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
      }
      
      const entries = fs.readdirSync(source, { withFileTypes: true });
      
      for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const targetPath = path.join(target, entry.name);
        
        if (entry.isDirectory()) {
          copyDirRecursively(sourcePath, targetPath);
        } else {
          fs.copyFileSync(sourcePath, targetPath);
        }
      }
    }
    
    copyDirRecursively(path.join(__dirname, 'src'), srcDir);
    console.log('✅ Copied source files');
    
    // Create simplified FileViewer component
    const componentDir = path.join(srcDir, 'components', 'ui');
    fs.mkdirSync(componentDir, { recursive: true });
    
    const fileViewerPath = path.join(componentDir, 'FileViewer.tsx');
    const fileViewerContent = `import React from 'react';

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
  className = "",
  onDownload
}) => {
  return (
    <div className={\`p-4 mb-6 border border-gray-200 rounded-lg shadow-sm \${className}\`}>
      <h3 className="mb-4 text-lg font-medium">File Preview</h3>
      <div className="flex flex-col items-center justify-center h-64 p-4 border border-dashed border-gray-300 rounded-md">
        <p className="mb-2 text-lg font-medium">{fileName}</p>
        <p className="text-sm text-gray-500">
          Preview not available in this deployment.
        </p>
        <button 
          onClick={onDownload}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Download File
        </button>
      </div>
    </div>
  );
};

export default FileViewer;`;
    
    fs.writeFileSync(fileViewerPath, fileViewerContent);
    console.log('✅ Created FileViewer component');
    
    // Create public directory
    const publicDir = path.join(tempDir, 'public');
    fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(
      path.join(publicDir, 'vercel-deploy.json'),
      JSON.stringify({ timestamp: new Date().toISOString() })
    );
    
    // Create vercel.json
    const vercelConfig = {
      "buildCommand": "node fix-build.mjs && vite build",
      "outputDirectory": "dist",
      "framework": "vite",
      "rewrites": [
        { "source": "/(.*)", "destination": "/index.html" }
      ]
    };
    
    fs.writeFileSync(
      path.join(tempDir, 'vercel.json'),
      JSON.stringify(vercelConfig, null, 2)
    );
    console.log('✅ Created vercel configuration');
    
    // Deploy to Vercel
    console.log('🚀 Deploying to Vercel...');
    execSync('vercel deploy --prod --yes', { 
      cwd: tempDir,
      stdio: 'inherit'
    });
    
    console.log('✅ Deployment completed!');
  } catch (error) {
    console.error('❌ Deployment error:', error.message);
    process.exit(1);
  }
}

createStandaloneProject();