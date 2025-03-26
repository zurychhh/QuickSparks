#!/usr/bin/env node

// Simple Vercel deployment script
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting simplified Vercel deployment process...');

try {
  // Create necessary build files if they don't exist
  const buildInfoPath = path.join(__dirname, 'public', 'build-info.json');
  if (!fs.existsSync(path.dirname(buildInfoPath))) {
    fs.mkdirSync(path.dirname(buildInfoPath), { recursive: true });
  }
  
  // Write build info
  const buildInfo = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    version: '1.0.0'
  };
  
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  console.log('✅ Created build info file');
  
  // Run the build
  console.log('🔨 Building the application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Deploy to Vercel
  console.log('🚀 Deploying to Vercel...');
  execSync('vercel --prod', { stdio: 'inherit' });
  
  console.log('✅ Deployment completed successfully!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}