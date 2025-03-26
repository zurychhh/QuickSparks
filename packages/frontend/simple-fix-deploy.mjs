#!/usr/bin/env node

/**
 * Simple script to fix the 404 error with Vercel deployment
 * This handles a direct deployment to the correct location
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 PDFSpark Simple Fix Deployment');
console.log('================================');

async function run(cmd, options = {}) {
  console.log(`> ${cmd}`);
  try {
    const { stdout, stderr } = await execAsync(cmd, options);
    if (stdout) console.log(stdout);
    if (stderr && !options.ignoreStderr) console.error(stderr);
    return { stdout, stderr };
  } catch (error) {
    console.error(`Command failed: ${cmd}`);
    console.error(error.message);
    throw error;
  }
}

async function deploy() {
  try {
    // Step 1: Verify build configuration
    console.log('Step 1: Verifying configuration...');
    const viteConfig = fs.readFileSync(path.join(__dirname, 'vite.config.ts'), 'utf8');
    if (!viteConfig.includes("base: '/pdfspark/'")) {
      console.log('Adding base: \'/pdfspark/\' to vite.config.ts');
      let updatedViteConfig = viteConfig.replace(
        'plugins: [react()],', 
        'plugins: [react()],\n  base: \'/pdfspark/\','
      );
      fs.writeFileSync(path.join(__dirname, 'vite.config.ts'), updatedViteConfig);
    }
    console.log('✅ Vite configuration verified');

    const appTsx = fs.readFileSync(path.join(__dirname, 'src/App.tsx'), 'utf8');
    if (!appTsx.includes('basename="/pdfspark"')) {
      console.error('❌ App.tsx is missing Router basename="/pdfspark" configuration');
      throw new Error('App.tsx needs Router basename configuration');
    }
    console.log('✅ Router configuration verified');

    // Step 2: Build the application
    console.log('Step 2: Building application...');
    await run('npm run build:vercel');
    console.log('✅ Build completed successfully');

    // Step 3: Copy vercel.json to dist folder
    console.log('Step 3: Adding deployment configuration...');
    
    // Copy vercel.json from public to dist
    if (fs.existsSync(path.join(__dirname, 'public/vercel.json'))) {
      fs.copyFileSync(
        path.join(__dirname, 'public/vercel.json'),
        path.join(__dirname, 'dist/vercel.json')
      );
      console.log('✅ Copied vercel.json to dist folder');
    } else {
      // Create vercel.json in dist
      const vercelConfig = {
        "version": 2,
        "public": true,
        "routes": [
          { "handle": "filesystem" },
          { "src": "/pdfspark/(.*)", "dest": "/$1" },
          { "src": "/(.*)", "dest": "/index.html" }
        ],
        "headers": [
          {
            "source": "/(.*)",
            "headers": [
              { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
              { "key": "X-Content-Type-Options", "value": "nosniff" },
              { "key": "X-Frame-Options", "value": "DENY" },
              { "key": "X-XSS-Protection", "value": "1; mode=block" },
              { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
            ]
          },
          {
            "source": "/assets/(.*)",
            "headers": [
              { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
            ]
          }
        ]
      };
      
      fs.writeFileSync(
        path.join(__dirname, 'dist/vercel.json'),
        JSON.stringify(vercelConfig, null, 2)
      );
      console.log('✅ Created vercel.json in dist folder');
    }

    // Step 4: Deploy to Vercel
    console.log('Step 4: Deploying to Vercel...');
    try {
      const { stdout } = await run('cd dist && vercel deploy --prod');
      
      // Extract deployment URL
      const deployUrl = stdout.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/)?.[0];
      
      console.log(`\n🎉 Deployment successful!`);
      console.log(`\nDeployment URL: ${deployUrl || 'URL not found in output'}`);
      console.log(`\nIMPORTANT: Your site should be accessible at ${deployUrl || 'the deployment URL'}/pdfspark`);
      
      // Save deployment info
      const deploymentInfo = {
        timestamp: new Date().toISOString(),
        url: deployUrl || 'unknown',
        success: true
      };
      
      // Ensure deployment-logs directory exists
      const logsDir = path.join(__dirname, 'deployment-logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(logsDir, 'last-successful-deploy.json'),
        JSON.stringify(deploymentInfo, null, 2)
      );
    } catch (deployError) {
      console.error('Deployment failed:', deployError.message);
      if (deployError.message.includes('Resource is limited')) {
        console.log('\n⚠️ Vercel free tier has a limit of 100 deployments per day.');
        console.log('You have reached this limit. Please try again later or wait about 24 hours.');
      }
      throw new Error('Vercel deployment failed');
    }
  } catch (error) {
    console.error(`\n❌ Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

deploy();