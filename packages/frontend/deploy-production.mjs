#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 PDFSpark Production Deployment');
console.log('================================');

async function run(cmd, options = {}) {
  console.log(`> ${cmd}`);
  const { stdout, stderr } = await execAsync(cmd, options);
  if (stdout) console.log(stdout);
  if (stderr && !options.ignoreStderr) console.error(stderr);
  return { stdout, stderr };
}

async function deploy() {
  try {
    console.log('Step 1: Verifying configuration...');
    
    // Check that Vite config has base: '/pdfspark/'
    const viteConfig = fs.readFileSync(path.join(__dirname, 'vite.config.ts'), 'utf8');
    if (!viteConfig.includes("base: '/pdfspark/'")) {
      throw new Error('Vite config is missing base: \'/pdfspark/\' configuration');
    }
    console.log('✅ Vite configuration has correct base path');
    
    // Check that App.tsx has Router basename="/pdfspark"
    const appFile = fs.readFileSync(path.join(__dirname, 'src/App.tsx'), 'utf8');
    if (!appFile.includes('basename="/pdfspark"')) {
      throw new Error('App.tsx is missing Router basename="/pdfspark" configuration');
    }
    console.log('✅ Router configuration has correct basename');
    
    // Check vercel.json
    if (!fs.existsSync(path.join(__dirname, 'vercel.json'))) {
      throw new Error('vercel.json is missing');
    }
    const vercelConfig = fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8');
    if (!vercelConfig.includes('"/pdfspark"')) {
      throw new Error('vercel.json is missing pdfspark path configuration');
    }
    console.log('✅ vercel.json has correct pdfspark configuration');
    
    console.log('\nStep 2: Building the application...');
    await run('npm run build');
    console.log('✅ Build completed');
    
    // Copy vercel.json to dist
    fs.copyFileSync(
      path.join(__dirname, 'vercel.json'),
      path.join(__dirname, 'dist', 'vercel.json')
    );
    console.log('✅ Copied vercel.json to dist directory');
    
    // Fix dist structure for subdirectory deployment
    console.log('\nStep 3: Fixing dist structure for /pdfspark/ subdirectory...');
    await run('node fix-dist-structure.mjs');
    console.log('✅ Fixed dist structure for subdirectory deployment');
    
    // Create a timestamp for logging
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    
    console.log('\nStep 3: Deploying to production...');
    
    // Check if we're already linked to a project
    const vercelConfigFile = path.join(__dirname, '.vercel', 'project.json');
    const isProjectLinked = fs.existsSync(vercelConfigFile);
    
    let deployCommand = 'cd dist && vercel deploy --prod --yes';
    
    if (isProjectLinked) {
      console.log('✅ Project is already linked to Vercel');
      
      // Read project info
      const projectConfig = JSON.parse(fs.readFileSync(vercelConfigFile, 'utf8'));
      console.log(`Project ID: ${projectConfig.projectId}`);
      console.log(`Organization ID: ${projectConfig.orgId}`);
    } else {
      console.log('⚠️ Project is not linked to Vercel, creating a new project...');
    }
    
    // Deploy to Vercel
    const deployResult = await run(deployCommand);
    
    // Log the deployment
    const logDir = path.join(__dirname, 'deployment-logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(logDir, `deploy-${timestamp}.log`),
      `Deployment Time: ${new Date().toISOString()}\n\nCommand: ${deployCommand}\n\nOutput:\n${deployResult.stdout}\n\nErrors:\n${deployResult.stderr || 'None'}`
    );
    
    // Extract deployment URL if available
    const deployUrl = deployResult.stdout.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/)?.[0];
    
    if (deployUrl) {
      const lastDeployment = {
        timestamp: new Date().toISOString(),
        url: deployUrl,
        buildSucceeded: true
      };
      
      fs.writeFileSync(
        path.join(logDir, 'last-successful-deploy.json'),
        JSON.stringify(lastDeployment, null, 2)
      );
      
      console.log(`\n🎉 Deployment successful! Your app is now available at: ${deployUrl}`);
      console.log(`\nYour app should now be accessible at: https://quicksparks.dev/pdfspark/`);
      
      console.log(`\nVerify your deployment by checking these URLs:`);
      console.log(`- Main page: https://quicksparks.dev/pdfspark/`);
      console.log(`- Product page: https://quicksparks.dev/pdfspark/product`);
      console.log(`- Conversion page: https://quicksparks.dev/pdfspark/convert`);
    } else {
      console.log(`\n⚠️ Deployment completed, but couldn't extract the URL from the output.`);
      console.log(`Check your Vercel dashboard for the deployment status.`);
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deploy();