#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Deploying to quicksparks.dev/pdfspark...');

async function deploy() {
  try {
    // Ensure dist directory exists
    if (!fs.existsSync(path.join(__dirname, 'dist'))) {
      console.log('❌ dist directory does not exist. Creating it with proper subdirectory build...');
      
      // Run the subdirectory-deploy.mjs script with prepare-only option
      await execAsync('node subdirectory-deploy.mjs --prepare-only', { stdio: 'inherit' });
    }
    
    console.log('✅ Found/prepared dist directory with subdirectory configuration.');
    
    // Create a proper vercel.json in the dist directory for subdirectory deployment
    const vercelConfig = {
      "version": 2,
      "public": true,
      "cleanUrls": true,
      "rewrites": [
        { "source": "/pdfspark/:path*", "destination": "/pdfspark/index.html" }
      ],
      "headers": [
        {
          "source": "/pdfspark/:path*",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=0, must-revalidate"
            }
          ]
        },
        {
          "source": "/pdfspark/assets/:path*",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=31536000, immutable"
            }
          ]
        }
      ]
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'dist', 'vercel.json'),
      JSON.stringify(vercelConfig, null, 2)
    );
    
    console.log('✅ Created vercel.json in dist directory for subdirectory deployment.');
    
    // Create a temporary project.json if not exists
    const projectJson = { "projectId": "prj_pdfspark", "orgId": "team_quicksparks" };
    
    const vercelDir = path.join(__dirname, 'dist', '.vercel');
    if (!fs.existsSync(vercelDir)) {
      fs.mkdirSync(vercelDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(vercelDir, 'project.json'),
      JSON.stringify(projectJson, null, 2)
    );
    
    console.log('🚀 Deploying static files to Vercel for subdirectory path...');
    
    // Deploy using Vercel CLI directly from dist directory with --name parameter
    const { stdout, stderr } = await execAsync('cd dist && vercel deploy --prod --yes --name pdfspark-frontend');
    
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log(`
🎉 Deployment completed!

Your app was successfully deployed to Vercel.
Now, configure the domain in Vercel dashboard:

1. Go to the Vercel dashboard and select the "pdfspark-frontend" project
2. Go to Settings > Domains
3. Add domain: quicksparks.dev
4. Configure path prefix: /pdfspark
5. Verify the deployment works at https://quicksparks.dev/pdfspark/
`);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

deploy();