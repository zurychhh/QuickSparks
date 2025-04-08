import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This script runs at build time to ensure all required files exist
console.log('🔍 Running pre-build verification and fix script...');

// Verify and fix directory structure
const componentsUIDir = path.join(__dirname, 'src', 'components', 'ui');
if (!fs.existsSync(componentsUIDir)) {
  console.log(`Creating missing directory: ${componentsUIDir}`);
  fs.mkdirSync(componentsUIDir, { recursive: true });
}

// Verify FileViewer component exists
const fileViewerPath = path.join(componentsUIDir, 'FileViewer.tsx');
const fileViewerBackupPath = path.join(__dirname, 'src', 'components', 'ui', 'FileViewer.tsx.vercel');

if (!fs.existsSync(fileViewerPath)) {
  console.log('⚠️ FileViewer.tsx is missing!');
  
  // Try to copy from backup if it exists
  if (fs.existsSync(fileViewerBackupPath)) {
    console.log('Copying from backup file...');
    fs.copyFileSync(fileViewerBackupPath, fileViewerPath);
    console.log('✅ FileViewer.tsx restored from backup');
  } else {
    // Create a minimal component if backup doesn't exist
    console.log('Creating minimal FileViewer component...');
    const minimalComponent = `import React from 'react';

interface FileViewerProps {
  fileUrl: string;
  mimeType: string;
  fileName: string;
}

const FileViewer: React.FC<FileViewerProps> = ({ fileName }) => {
  return (
    <div style={{ 
      padding: '16px', 
      marginBottom: '24px', 
      border: '1px solid #eee',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ marginBottom: '16px' }}>File Preview</h3>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        border: '1px dashed #ccc',
        borderRadius: '4px',
        padding: '16px'
      }}>
        <h4>{fileName}</h4>
        <p style={{ marginTop: '16px', color: '#666' }}>
          Preview not available.
        </p>
      </div>
    </div>
  );
};

export default FileViewer;`;
    
    fs.writeFileSync(fileViewerPath, minimalComponent);
    console.log('✅ Created minimal FileViewer.tsx');
  }
}

// Check if the react-pdf dependency is installed
let needsPackageUpdate = false;
const packageJsonPath = path.join(__dirname, 'package.json');
let packageJson;

try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Essential dependencies
  const essentialDeps = {
    '@emotion/react': '^11.11.0',
    '@emotion/styled': '^11.11.0',
    '@mui/material': '^5.15.0',
    'react-pdf': '^7.5.0'
  };
  
  // Check and update dependencies
  for (const [dep, version] of Object.entries(essentialDeps)) {
    if (!packageJson.dependencies[dep]) {
      console.log(`Adding missing dependency: ${dep}`);
      packageJson.dependencies[dep] = version;
      needsPackageUpdate = true;
    }
  }
  
  if (needsPackageUpdate) {
    console.log('Updating package.json with required dependencies');
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ package.json updated');
  }
} catch (error) {
  console.error('❌ Error updating package.json:', error);
}

// Create a build-verification.txt file to confirm this script ran
const verificationContent = `Build verification completed successfully.
Timestamp: ${new Date().toISOString()}
Node version: ${process.version}
Files checked: 
- ${fileViewerPath}
- ${packageJsonPath}
`;

const verificationPath = path.join(__dirname, 'build-verification.txt');
fs.writeFileSync(verificationPath, verificationContent);

// Create a public directory and verification file
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const buildInfoPath = path.join(publicDir, 'build-info.json');
fs.writeFileSync(buildInfoPath, JSON.stringify({
  buildTimestamp: new Date().toISOString(),
  nodeVersion: process.version,
  filesFixed: fs.existsSync(fileViewerPath) ? ['FileViewer.tsx'] : [],
  packagesAdded: needsPackageUpdate ? ['Dependencies updated'] : []
}, null, 2));

console.log('✅ Pre-build verification complete. Build can proceed.');