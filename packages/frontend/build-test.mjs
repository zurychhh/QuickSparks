#!/usr/bin/env node

// This script is used to verify the build process
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Testing the Vercel build process...');

try {
  // Run the build:vercel script 
  console.log('Running build:vercel script...');
  execSync('pnpm run build:vercel', { stdio: 'inherit' });
  
  // Check if the dist directory was created
  const distPath = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    console.log('Build successful! ✅');
    console.log(`Dist directory created at: ${distPath}`);
    
    // List the files in the dist directory
    const files = fs.readdirSync(distPath);
    console.log('Files in dist directory:');
    files.forEach(file => console.log(`- ${file}`));
    
    process.exit(0);
  } else {
    console.error('Error: dist directory was not created! ❌');
    process.exit(1);
  }
} catch (error) {
  console.error('Build process failed! ❌');
  console.error(error.toString());
  process.exit(1);
}