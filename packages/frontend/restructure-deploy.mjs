#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 PDFSpark Subdirectory Restructuring and Deployment');
console.log('==================================================');

async function run(cmd) {
  console.log(`> ${cmd}`);
  const { stdout, stderr } = await execAsync(cmd);
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
  return { stdout, stderr };
}

async function deploy() {
  try {
    console.log('Step 1: Building the application...');
    await run('npm run build');
    console.log('✅ Build completed');
    
    console.log('\nStep 2: Creating special root index.html...');
    // Create a redirect index.html for the root
    const rootIndexHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0;url=/pdfspark/" />
    <title>Redirecting to PDFSpark</title>
  </head>
  <body>
    <p>If you are not redirected automatically, follow this <a href="/pdfspark/">link to PDFSpark</a>.</p>
  </body>
</html>
    `;
    
    // Save the original index.html
    const originalIndexHtml = fs.readFileSync(path.join(__dirname, 'dist', 'index.html'), 'utf8');
    
    // Replace the root index.html with the redirect
    fs.writeFileSync(
      path.join(__dirname, 'dist', 'index.html'),
      rootIndexHtml
    );
    
    console.log('✅ Created root index.html with redirect to /pdfspark/');
    
    console.log('\nStep 3: Creating pdfspark directory with app contents...');
    
    // Create pdfspark directory if it doesn't exist
    const pdfspark_dir = path.join(__dirname, 'dist', 'pdfspark');
    if (!fs.existsSync(pdfspark_dir)) {
      fs.mkdirSync(pdfspark_dir, { recursive: true });
    }
    
    // Copy the original index.html to pdfspark directory
    fs.writeFileSync(
      path.join(pdfspark_dir, 'index.html'),
      originalIndexHtml
    );
    
    // Copy all assets to pdfspark/assets directory
    const assets_dir = path.join(__dirname, 'dist', 'assets');
    const pdfspark_assets_dir = path.join(pdfspark_dir, 'assets');
    
    if (!fs.existsSync(pdfspark_assets_dir)) {
      fs.mkdirSync(pdfspark_assets_dir, { recursive: true });
    }
    
    // Copy all assets
    const assetFiles = fs.readdirSync(assets_dir);
    for (const file of assetFiles) {
      fs.copyFileSync(
        path.join(assets_dir, file),
        path.join(pdfspark_assets_dir, file)
      );
    }
    
    // Copy favicon and other root files
    const rootFiles = [
      'favicon.svg',
      'logo.svg'
    ];
    
    for (const file of rootFiles) {
      if (fs.existsSync(path.join(__dirname, 'dist', file))) {
        fs.copyFileSync(
          path.join(__dirname, 'dist', file),
          path.join(pdfspark_dir, file)
        );
      }
    }
    
    console.log('✅ Created pdfspark directory with all app contents');
    
    console.log('\nStep 4: Creating custom vercel.json...');
    
    // Create specialized vercel.json
    const vercelConfig = {
      "version": 2,
      "public": true,
      "cleanUrls": true,
      "rewrites": [
        { "source": "/pdfspark", "destination": "/pdfspark/index.html" },
        { "source": "/pdfspark/(.*)", "destination": "/pdfspark/$1" }
      ]
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'dist', 'vercel.json'),
      JSON.stringify(vercelConfig, null, 2)
    );
    
    console.log('✅ Created vercel.json with subdirectory configuration');
    
    console.log('\nStep 5: Deploying to Vercel...');
    
    // Deploy to Vercel
    const { stdout } = await run('cd dist && vercel deploy --prod --yes');
    
    // Extract deployment URL
    const deployUrl = stdout.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/)?.[0];
    
    console.log(`\n🎉 Deployment successful!`);
    
    if (deployUrl) {
      console.log(`\nYour app should now be accessible at:`);
      console.log(`- Deployment URL: ${deployUrl}`);
      console.log(`- Production URL: https://quicksparks.dev/pdfspark/`);
      
      // Save deployment info
      const deploymentInfo = {
        timestamp: new Date().toISOString(),
        url: deployUrl,
        buildSucceeded: true
      };
      
      fs.writeFileSync(
        path.join(__dirname, 'deployment-logs', 'last-successful-deploy.json'),
        JSON.stringify(deploymentInfo, null, 2)
      );
    }
    
    console.log(`\nIMPORTANT: If you're still seeing a 404 error:`);
    console.log(`1. Check the Vercel dashboard for any routing issues`);
    console.log(`2. Verify that the DNS for quicksparks.dev is properly configured`);
    console.log(`3. Try accessing ${deployUrl}/pdfspark/ directly to test`);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deploy();