#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🚀 Deploying pre-built dist directory to Vercel...');

async function deploy() {
  try {
    // Ensure dist directory exists
    if (!fs.existsSync(path.join(process.cwd(), 'dist'))) {
      console.log('❌ dist directory does not exist. Run build first.');
      process.exit(1);
    }

    console.log('✅ Found dist directory.');
    console.log('🚀 Deploying static files to Vercel...');

    // Deploy using Vercel CLI from dist directory with static configuration
    const { stdout, stderr } = await execAsync('cd dist && vercel deploy --prod --yes --name pdfspark-frontend --confirm');
    
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('✅ Deployment complete!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

deploy();