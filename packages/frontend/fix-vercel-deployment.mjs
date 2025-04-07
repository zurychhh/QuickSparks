#!/usr/bin/env node

/**
 * Script to fix Vercel deployment issues
 * This script focuses on making the application work correctly with or without /pdfspark path
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 PDFSpark Vercel Deployment Fix');
console.log('===============================');

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

async function fixDeployment() {
  try {
    // Create a dist-fix directory
    const distFixDir = path.join(__dirname, 'dist-fix');
    if (fs.existsSync(distFixDir)) {
      fs.rmSync(distFixDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distFixDir, { recursive: true });
    console.log(`Created directory: ${distFixDir}`);

    // Build the application first
    console.log('\nStep 1: Building the application...');
    await run('npm run build:vercel');
    console.log('✅ Build completed');

    // Copy all files from dist to dist-fix
    console.log('\nStep 2: Preparing distribution files...');
    await run(`cp -R ${path.join(__dirname, 'dist')}/* ${distFixDir}/`);
    console.log('✅ Files copied to dist-fix');

    // Create an optimized vercel.json
    console.log('\nStep 3: Creating optimized Vercel configuration...');
    const vercelConfig = {
      "version": 2,
      "public": true,
      "rewrites": [
        // Handle the direct paths for SPA routing
        { "source": "/", "destination": "/index.html" },
        { "source": "/:path*", "destination": "/index.html" },
        
        // Handle /pdfspark path
        { "source": "/pdfspark", "destination": "/index.html" },
        { "source": "/pdfspark/:path*", "destination": "/index.html" }
      ],
      "headers": [
        {
          "source": "/(.*)",
          "headers": [
            { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" },
            { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
            { "key": "X-Content-Type-Options", "value": "nosniff" },
            { "key": "X-Frame-Options", "value": "DENY" },
            { "key": "X-XSS-Protection", "value": "1; mode=block" }
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
      path.join(distFixDir, 'vercel.json'),
      JSON.stringify(vercelConfig, null, 2)
    );
    console.log('✅ Created vercel.json in dist-fix');

    // Create a modified index.html that works with HashRouter
    console.log('\nStep 4: Creating a modified index.html for HashRouter implementation...');
    
    let indexHtml = fs.readFileSync(path.join(distFixDir, 'index.html'), 'utf8');
    
    // Remove any existing base tag since we're using HashRouter now
    indexHtml = indexHtml.replace(/<base href="[^"]*"[^>]*>/g, '');
    
    // IMPORTANT: Add Google verification meta tag at the beginning of the head
    console.log('Adding Google verification meta tag (CRITICAL)...');
    indexHtml = indexHtml.replace(
      /<head[^>]*>/,
      '$&\n    <meta name="google-site-verification" content="WIKscPK-LpMMM63OZiE66Gsg1K0LXmXSt5z6wP4AqwQ" />'
    );
    
    // Update paths to be relative
    indexHtml = indexHtml.replace(/href="\/pdfspark\//g, 'href="./');
    indexHtml = indexHtml.replace(/src="\/pdfspark\//g, 'src="./');
    indexHtml = indexHtml.replace(/href="\/src/g, 'href="./src');
    indexHtml = indexHtml.replace(/src="\/src/g, 'src="./src');
    
    fs.writeFileSync(path.join(distFixDir, 'index.html'), indexHtml);
    console.log('✅ Modified index.html for HashRouter implementation');

    // Create a simple monitoring script
    console.log('\nStep 5: Creating simple monitoring script...');
    
    const initScript = `
// HashRouter monitoring script
window.addEventListener('DOMContentLoaded', function() {
  // Get the React app container
  var root = document.getElementById('root');
  if (!root) return;
  
  // Add a small indicator to show we're in HashRouter mode
  var pathNote = document.createElement('div');
  pathNote.style.position = 'fixed';
  pathNote.style.bottom = '5px';
  pathNote.style.right = '5px';
  pathNote.style.padding = '3px 6px';
  pathNote.style.background = 'rgba(0,0,0,0.5)';
  pathNote.style.color = 'white';
  pathNote.style.fontSize = '10px';
  pathNote.style.borderRadius = '3px';
  pathNote.style.zIndex = '9999';
  pathNote.textContent = 'HashRouter mode';
  
  document.body.appendChild(pathNote);
  
  // Log navigation to help with debugging
  window.addEventListener('hashchange', function() {
    console.log('Navigation to: ' + window.location.hash);
  });
});
`;
    
    fs.writeFileSync(path.join(distFixDir, 'hash-router-monitor.js'), initScript);
    
    // Update index.html to include the monitoring script with relative path
    indexHtml = fs.readFileSync(path.join(distFixDir, 'index.html'), 'utf8');
    indexHtml = indexHtml.replace('</body>', '<script src="./hash-router-monitor.js"></script></body>');
    fs.writeFileSync(path.join(distFixDir, 'index.html'), indexHtml);
    
    console.log('✅ Created HashRouter monitoring script and added to index.html');

    // Create package.json in dist-fix
    console.log('\nStep 6: Creating package.json...');
    const packageJson = {
      "name": "pdfspark-frontend-fixed",
      "version": "1.0.0",
      "private": true,
      "type": "module",
      "scripts": {
        "start": "serve -s",
        "build": "npx vite build",
        "vercel-build": "npx vite build"
      },
      "dependencies": {
        "vite": "^5.1.6"
      }
    };
    
    fs.writeFileSync(
      path.join(distFixDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    console.log('✅ Created package.json in dist-fix');
    
    // Create Google verification file
    console.log('\nStep 6.1: Creating Google verification file...');
    fs.writeFileSync(
      path.join(distFixDir, 'googlefaa9d441c86b843b.html'),
      'google-site-verification: googlefaa9d441c86b843b.html'
    );
    console.log('✅ Created Google verification file');

    // Deploy to Vercel
    console.log('\nStep 7: Deploying to Vercel...');
    try {
      // First set project settings to public
      await run(`cd ${distFixDir} && vercel --public --yes`);
      
      // Then deploy with production flag
      const { stdout } = await run(`cd ${distFixDir} && vercel deploy --prod --yes --public`);
      
      // Extract deployment URL
      const deployUrl = stdout.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/)?.[0];
      
      console.log(`\n🎉 Deployment successful!`);
      console.log(`\nDeployment URL: ${deployUrl || 'URL not found in output'}`);
      console.log(`\nYou can now access the application at:`);
      console.log(`1. Direct mode: ${deployUrl || 'your-deployment-url'}`);
      console.log(`2. Subdirectory mode: ${deployUrl || 'your-deployment-url'}/pdfspark`);
      
      // Save deployment info
      const deploymentInfo = {
        timestamp: new Date().toISOString(),
        url: deployUrl || 'unknown',
        success: true,
        fixedVersion: true
      };
      
      // Ensure deployment-logs directory exists
      const logsDir = path.join(__dirname, 'deployment-logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(logsDir, 'fixed-deployment.json'),
        JSON.stringify(deploymentInfo, null, 2)
      );
      
      // Final instructions
      console.log(`\n📝 Next steps:`);
      console.log(`1. Test both paths (with and without /pdfspark) to verify they work`);
      console.log(`2. Set up the domain in Vercel dashboard to point to this deployment`);
      console.log(`3. If needed, set up redirects from the main domain to the /pdfspark path`);
      
    } catch (deployError) {
      console.error('Deployment failed:', deployError.message);
      
      if (deployError.message.includes('Resource is limited')) {
        console.log('\n⚠️ Vercel free tier has a limit of 100 deployments per day.');
        console.log('You have reached this limit. Try again later or use the Vercel dashboard.');
        console.log('\nIn the meantime, you can:');
        console.log(`1. Manually upload the files from ${distFixDir} to the Vercel dashboard`);
        console.log('2. Set the project to use the production branch instead of main');
        console.log('3. Configure the domain in the Vercel dashboard');
      }
      
      throw new Error('Vercel deployment failed');
    }
    
  } catch (error) {
    console.error(`\n❌ Deployment process failed: ${error.message}`);
    console.error('Please fix the issues and try again.');
    process.exit(1);
  }
}

// Run the deployment process
fixDeployment();