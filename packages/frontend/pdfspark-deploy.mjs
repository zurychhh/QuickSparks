#!/usr/bin/env node

/**
 * PDFSpark Deployment Script for Vercel
 * 
 * This script implements the solution from vercelsolution.md with specific
 * tweaks for our project structure. It handles deployment to /pdfspark subdirectory.
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 PDFSpark Deployment Script for Vercel Subdirectory');
console.log('===================================================');

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
    // Step 1: Verify configuration is correct
    console.log('Step 1: Verifying configuration...');
    
    console.log('✅ Verifying vercel.json');
    const vercelJson = fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8');
    if (!vercelJson.includes('/pdfspark')) {
      throw new Error('vercel.json is missing /pdfspark routes');
    }
    
    console.log('✅ Verifying vite.config.ts');
    const viteConfig = fs.readFileSync(path.join(__dirname, 'vite.config.ts'), 'utf8');
    if (!viteConfig.includes("base: '/pdfspark/'")) {
      throw new Error('vite.config.ts is missing base: \'/pdfspark/\' configuration');
    }
    
    console.log('✅ Verifying index.html');
    const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    if (!indexHtml.includes('<base href="/pdfspark/"')) {
      throw new Error('index.html is missing <base href="/pdfspark/"> tag');
    }

    console.log('✅ Verifying main.tsx');
    const mainTsx = fs.readFileSync(path.join(__dirname, 'src/main.tsx'), 'utf8');
    if (!mainTsx.includes('basename="/pdfspark"')) {
      throw new Error('main.tsx is missing BrowserRouter with basename="/pdfspark"');
    }

    console.log('✅ All configuration files look correct');

    // Step 2: Build the application
    console.log('\nStep 2: Building application...');
    await run('npm run build:vercel');
    
    // Step 3: Copy vercel.json to dist folder
    console.log('\nStep 3: Preparing deployment files...');
    
    // Copy vercel.json to dist
    fs.copyFileSync(
      path.join(__dirname, 'vercel.json'),
      path.join(__dirname, 'dist', 'vercel.json')
    );
    console.log('✅ Copied vercel.json to dist');
    
    // Create a package.json in dist for Vercel
    const packageJson = {
      "name": "pdfspark-frontend",
      "version": "1.0.0",
      "private": true,
      "type": "module",
      "scripts": {
        "start": "serve -s"
      }
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'dist', 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    console.log('✅ Created package.json in dist');
    
    // Ensure Google Search Console verification files are present
    
    // First, ensure the public directory exists in the dist folder
    const distPublicDir = path.join(__dirname, 'dist', 'public');
    if (!fs.existsSync(distPublicDir)) {
      fs.mkdirSync(distPublicDir, { recursive: true });
    }
    
    // Create the Google verification file
    const googleVerificationFile = path.join(distPublicDir, 'googlefaa9d441c86b843b.html');
    fs.writeFileSync(googleVerificationFile, 'google-site-verification: googlefaa9d441c86b843b.html');
    console.log('✅ Created Google verification file in dist/public');
    
    // Also copy to root of dist
    fs.writeFileSync(
      path.join(__dirname, 'dist', 'googlefaa9d441c86b843b.html'),
      'google-site-verification: googlefaa9d441c86b843b.html'
    );
    console.log('✅ Created Google verification file in dist root');
    
    // Also copy to pdfspark subfolder
    const pdfsparkDir = path.join(__dirname, 'dist', 'pdfspark');
    if (fs.existsSync(pdfsparkDir)) {
      fs.writeFileSync(
        path.join(pdfsparkDir, 'googlefaa9d441c86b843b.html'),
        'google-site-verification: googlefaa9d441c86b843b.html'
      );
      console.log('✅ Created Google verification file in dist/pdfspark');
    }
    
    // Now check if the meta tag is in the built index.html
    const builtIndexPath = path.join(__dirname, 'dist', 'pdfspark', 'index.html');
    if (fs.existsSync(builtIndexPath)) {
      let builtIndexContent = fs.readFileSync(builtIndexPath, 'utf8');
      
      if (!builtIndexContent.includes('google-site-verification')) {
        console.log('Adding Google verification meta tag to built index.html...');
        builtIndexContent = builtIndexContent.replace(
          /<meta name="viewport".*?>/,
          '$&\n    <meta name="google-site-verification" content="WIKscPK-LpMMM63OZiE66Gsg1K0LXmXSt5z6wP4AqwQ" />'
        );
        fs.writeFileSync(builtIndexPath, builtIndexContent);
        console.log('✅ Added Google verification meta tag to built index.html');
      } else {
        console.log('✅ Google verification meta tag already present in built index.html');
      }
    }
    
    // Step 4: Deploy to Vercel
    console.log('\nStep 4: Deploying to Vercel...');
    try {
      const { stdout } = await run('cd dist && vercel deploy --prod --yes');
      
      // Extract deployment URL
      const deployUrl = stdout.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/)?.[0];
      
      console.log(`\n🎉 Deployment successful!`);
      console.log(`\nDeployment URL: ${deployUrl || 'URL not found in output'}`);
      console.log(`\nTo access your application, visit: ${deployUrl || 'the deployment URL'}/pdfspark`);
      
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
        path.join(logsDir, 'pdfspark-deployment.json'),
        JSON.stringify(deploymentInfo, null, 2)
      );
      
      console.log(`\n📝 Verification Instructions:`);
      console.log(`1. Open the URL: ${deployUrl || 'your deployment URL'}/pdfspark`);
      console.log(`2. Check if all pages and assets load correctly`);
      console.log(`3. Test refreshing pages to ensure they don't result in 404 errors`);
      console.log(`4. Open the browser's console and paste the content of tools/verify-pdfspark-deployment.js`);
      
    } catch (deployError) {
      console.error('Deployment failed:', deployError.message);
      
      if (deployError.message.includes('Resource is limited')) {
        console.log('\n⚠️ Vercel free tier has a limit of 100 deployments per day.');
        console.log('You have reached this limit. Please try again later or wait about 24 hours.');
        console.log('\nIn the meantime, you can:');
        console.log('1. Update the project settings in the Vercel dashboard to use the production branch');
        console.log('2. Make sure the Build Command is set to: npm run build:vercel');
        console.log('3. Set the Output Directory to: dist');
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
deploy();