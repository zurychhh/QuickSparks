#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 PDFSpark Deployment to Vercel');
console.log('=============================');

async function run(cmd, options = {}) {
  console.log(`> ${cmd}`);
  const { stdout, stderr } = await execAsync(cmd, options);
  if (stdout) console.log(stdout);
  if (stderr && !options.ignoreStderr) console.error(stderr);
  return { stdout, stderr };
}

async function deploy() {
  try {
    console.log('Step 1: Verifying build configuration...');
    
    // Check if vite.config.ts has base: '/pdfspark/'
    const viteConfig = fs.readFileSync(path.join(__dirname, 'vite.config.ts'), 'utf8');
    if (!viteConfig.includes("base: '/pdfspark/'")) {
      throw new Error('Vite config is missing base: \'/pdfspark/\' configuration');
    }
    console.log('✅ Vite configuration verified');
    
    // Check if Router has basename="/pdfspark" in either App.tsx or main.tsx
    const appFile = fs.readFileSync(path.join(__dirname, 'src/App.tsx'), 'utf8');
    const mainFile = fs.readFileSync(path.join(__dirname, 'src/main.tsx'), 'utf8');
    
    if (!appFile.includes('basename="/pdfspark"') && !mainFile.includes('basename="/pdfspark"')) {
      throw new Error('Neither App.tsx nor main.tsx has Router basename="/pdfspark" configuration');
    }
    console.log('✅ Router configuration verified');
    
    console.log('Step 2: Building application...');
    await run('npm run build:vercel');
    console.log('✅ Build completed successfully');
    
    console.log('Step 3: Preparing Vercel configuration...');
    
    // Create vercel.json in dist
    const vercelConfig = {
      "version": 2,
      "public": true,
      "cleanUrls": true,
      "rewrites": [
        { "source": "/pdfspark", "destination": "/index.html" },
        { "source": "/pdfspark/(.*)", "destination": "/$1" }
      ],
      "headers": [
        {
          "source": "/(.*)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=0, must-revalidate"
            },
            {
              "key": "Strict-Transport-Security",
              "value": "max-age=31536000; includeSubDomains; preload"
            },
            {
              "key": "X-Content-Type-Options",
              "value": "nosniff"
            },
            {
              "key": "X-Frame-Options",
              "value": "DENY"
            },
            {
              "key": "X-XSS-Protection",
              "value": "1; mode=block"
            }
          ]
        },
        {
          "source": "/assets/(.*)",
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
    console.log('✅ Created vercel.json for proper routing');
    
    // Create an empty package.json to avoid build process
    fs.writeFileSync(
      path.join(__dirname, 'dist', 'package.json'),
      JSON.stringify({ 
        "name": "pdfspark-frontend",
        "version": "1.0.0",
        "private": true
      }, null, 2)
    );
    console.log('✅ Created minimal package.json in dist');
    
    // Create a .vercel directory if it doesn't exist
    const vercelDir = path.join(__dirname, 'dist', '.vercel');
    if (!fs.existsSync(vercelDir)) {
      fs.mkdirSync(vercelDir, { recursive: true });
    }
    
    console.log('Step 4: Deploying to Vercel...');
    
    try {
      console.log('Deploying with public access...');
      
      // Force a clean deploy by removing existing .vercel/project.json if exists
      const projectJsonPath = path.join(vercelDir, 'project.json');
      if (fs.existsSync(projectJsonPath)) {
        fs.unlinkSync(projectJsonPath);
      }
      
      const { stdout } = await run('cd dist && vercel deploy --prod --yes', { stdio: 'inherit' });
      
      // Extract deployment URL
      const deployUrl = stdout.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/)?.[0];
      
      console.log(`\n🎉 Deployment successful!`);
      console.log(`\nDeployment URL: ${deployUrl || 'URL not found in output'}`);
      console.log(`\nIMPORTANT: Your site should be accessible at ${deployUrl || 'the deployment URL'}`);
      console.log(`To check your deployment, visit: ${deployUrl || 'the deployment URL'}/pdfspark`);
      
      // Save deployment info
      const deploymentInfo = {
        timestamp: new Date().toISOString(),
        url: deployUrl || 'unknown',
        buildSucceeded: true
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
      console.error('Deployment failed:', deployError);
      throw new Error('Vercel deployment failed');
    }
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deploy();