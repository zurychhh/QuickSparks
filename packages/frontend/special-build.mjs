#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 PDFSpark Special Build for /pdfspark/ Path');
console.log('===========================================');

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
    
    console.log('\nStep 2: Creating special structure...');
    
    // Clean up any existing pdfspark directory
    const pdfspark_dir = path.join(__dirname, 'dist', 'pdfspark');
    if (fs.existsSync(pdfspark_dir)) {
      fs.rmSync(pdfspark_dir, { recursive: true, force: true });
    }
    
    // Create pdfspark directory
    fs.mkdirSync(pdfspark_dir, { recursive: true });
    
    // Copy index.html to pdfspark directory
    fs.copyFileSync(
      path.join(__dirname, 'dist', 'index.html'),
      path.join(pdfspark_dir, 'index.html')
    );
    
    // Create pdfspark/assets directory
    const pdfspark_assets_dir = path.join(pdfspark_dir, 'assets');
    fs.mkdirSync(pdfspark_assets_dir, { recursive: true });
    
    // Copy all assets to pdfspark/assets
    const assets_dir = path.join(__dirname, 'dist', 'assets');
    const assetFiles = fs.readdirSync(assets_dir);
    for (const file of assetFiles) {
      fs.copyFileSync(
        path.join(assets_dir, file),
        path.join(pdfspark_assets_dir, file)
      );
    }
    
    // Copy other files
    const otherFiles = ['favicon.svg', 'logo.svg'];
    for (const file of otherFiles) {
      if (fs.existsSync(path.join(__dirname, 'dist', file))) {
        fs.copyFileSync(
          path.join(__dirname, 'dist', file),
          path.join(pdfspark_dir, file)
        );
      }
    }
    
    // Create a redirect index.html
    const redirectHtml = `
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
    
    // Replace the root index.html with the redirect
    fs.writeFileSync(
      path.join(__dirname, 'dist', 'index.html'),
      redirectHtml
    );
    
    console.log('✅ Created special structure for /pdfspark/ path');
    
    console.log('\nStep 3: Creating optimized vercel.json...');
    
    // Create a specialized vercel.json
    const vercelJson = {
      "version": 2,
      "cleanUrls": true,
      "trailingSlash": false,
      "rewrites": [
        { 
          "source": "/", 
          "destination": "/index.html" 
        },
        { 
          "source": "/pdfspark", 
          "destination": "/pdfspark/index.html" 
        },
        { 
          "source": "/pdfspark/(.*)", 
          "destination": "/pdfspark/$1" 
        }
      ]
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'dist', 'vercel.json'),
      JSON.stringify(vercelJson, null, 2)
    );
    
    console.log('✅ Created optimized vercel.json');
    
    // Create convert.html redirect files for all routes
    const routes = [
      'convert',
      'product',
      'pricing',
      'about',
      'checkout',
      'account',
      'health'
    ];
    
    for (const route of routes) {
      const routeRedirect = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0;url=/pdfspark/${route}" />
    <title>Redirecting to PDFSpark ${route}</title>
  </head>
  <body>
    <p>If you are not redirected automatically, follow this <a href="/pdfspark/${route}">link to PDFSpark ${route}</a>.</p>
  </body>
</html>
      `;
      
      // Create route HTML file
      fs.writeFileSync(
        path.join(__dirname, 'dist', `${route}.html`),
        routeRedirect
      );
      
      // Also create the file inside pdfspark directory
      const routeHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/pdfspark/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="QuickSparks - Fast, reliable PDF and DOCX conversion service with secure payment processing." />
    <title>QuickSparks - Document Conversion Service</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
    <script type="module" crossorigin src="/pdfspark/assets/index-CYjaYynn.js"></script>
    <link rel="modulepreload" crossorigin href="/pdfspark/assets/react-BKU87Gzz.js">
    <link rel="modulepreload" crossorigin href="/pdfspark/assets/router-B_sUl22Z.js">
    <link rel="modulepreload" crossorigin href="/pdfspark/assets/zustand-CzsH10Ka.js">
    <link rel="stylesheet" crossorigin href="/pdfspark/assets/index-Cc4Bn2E8.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
      `;
      
      fs.writeFileSync(
        path.join(pdfspark_dir, `${route}.html`),
        routeHtml
      );
    }
    
    console.log('✅ Created redirect files for all routes');
    
    console.log('\nStep 4: Deploying to Vercel...');
    
    // Deploy to Vercel
    const { stdout } = await run('cd dist && vercel deploy --prod --yes');
    
    // Extract deployment URL
    const deployUrl = stdout.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/)?.[0];
    
    console.log(`\n🎉 Deployment successful!`);
    
    if (deployUrl) {
      console.log(`\nYour app should now be accessible at:`);
      console.log(`- Deployment URL: ${deployUrl}`);
      console.log(`- Production URL: https://quicksparks.dev/pdfspark/`);
      console.log(`- Routes: https://quicksparks.dev/pdfspark/convert, etc.`);
      
      // Save deployment info
      const deploymentInfo = {
        timestamp: new Date().toISOString(),
        url: deployUrl,
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
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deploy();