import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 Vercel build script: Ensuring all required files exist...');

// Check if FileViewer component exists, if not copy from backup
const fileViewerPath = path.join(__dirname, 'src/components/ui/FileViewer.tsx');
const fileViewerBackupPath = path.join(__dirname, 'src/components/ui/FileViewer.tsx.vercel');

if (!fs.existsSync(fileViewerPath) && fs.existsSync(fileViewerBackupPath)) {
  console.log('⚠️ FileViewer component missing. Copying from backup...');
  
  // Ensure the directory exists
  const dir = path.dirname(fileViewerPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Copy the backup file
  fs.copyFileSync(fileViewerBackupPath, fileViewerPath);
  console.log('✅ FileViewer component copied successfully!');
} else if (fs.existsSync(fileViewerPath)) {
  console.log('✅ FileViewer component already exists.');
} else {
  console.error('❌ FileViewer component is missing and backup not found!');
  process.exit(1);
}

// Check that the required dependencies are in package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const requiredDependencies = {
  '@emotion/react': '^11.11.4',
  '@emotion/styled': '^11.11.0',
  '@mui/material': '^5.15.14',
  'react-pdf': '^7.7.1'
};

let dependenciesModified = false;

for (const [dep, version] of Object.entries(requiredDependencies)) {
  if (!packageJson.dependencies[dep]) {
    console.log(`⚠️ Adding missing dependency: ${dep}@${version}`);
    packageJson.dependencies[dep] = version;
    dependenciesModified = true;
  }
}

if (dependenciesModified) {
  console.log('💾 Updating package.json with required dependencies...');
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ package.json updated successfully!');
}

// Create a verification file to confirm build script ran
fs.writeFileSync(
  path.join(__dirname, 'public', 'vercel-build-verification.json'),
  JSON.stringify({
    buildTimestamp: new Date().toISOString(),
    buildVersion: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    filesChecked: ['FileViewer.tsx', 'package.json'],
    nodeVersion: process.version
  }, null, 2)
);

console.log('✅ Vercel build verification complete! Ready to build.');