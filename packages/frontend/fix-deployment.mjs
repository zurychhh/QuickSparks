#!/usr/bin/env node

// Fixed Vercel deployment script
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting fixed Vercel deployment process...');

try {
  // Create a temporary vercel.json with proper routing
  const vercelConfig = {
    "version": 2,
    "routes": [
      { "src": "/(.*)", "dest": "/index.html" }
    ],
    "public": true
  };
  
  fs.writeFileSync(path.join(__dirname, 'dist', 'vercel.json'), JSON.stringify(vercelConfig, null, 2));
  console.log('✅ Created temporary vercel.json with SPA routing');
  
  // Deploy from the project root (not just dist)
  console.log('🚀 Deploying to Vercel with proper configuration...');
  execSync('vercel --prod --yes', { 
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('✅ Deployment completed!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}