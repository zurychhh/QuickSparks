#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import readline from 'readline';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('🚀 PDFSpark Host Under Existing Domain Tool');
console.log('=========================================');

async function run(cmd, options = {}) {
  console.log(`> ${cmd}`);
  const { stdout, stderr } = await execAsync(cmd, options);
  if (stdout) console.log(stdout);
  if (stderr && !options.ignoreStderr) console.error(stderr);
  return { stdout, stderr };
}

async function deploy() {
  try {
    console.log('\nThis tool will help configure PDFSpark to run under an existing domain at /pdfspark path.');
    console.log('It requires access to the Vercel project hosting the main domain.');
    
    const mainProjectId = await question('\nEnter the Vercel project ID hosting quicksparks.dev (e.g., prj_xxxx): ');
    
    if (!mainProjectId || !mainProjectId.startsWith('prj_')) {
      throw new Error('Invalid project ID. Must start with prj_');
    }
    
    console.log('\nStep 1: Building PDFSpark with subdirectory configuration...');
    
    // Ensure vite config and Router have correct subdirectory settings
    const viteConfig = fs.readFileSync(path.join(__dirname, 'vite.config.ts'), 'utf8');
    if (!viteConfig.includes("base: '/pdfspark/'")) {
      throw new Error('Vite config is missing base: \'/pdfspark/\' configuration');
    }
    console.log('✅ Vite configuration has correct base path');
    
    const appFile = fs.readFileSync(path.join(__dirname, 'src/App.tsx'), 'utf8');
    if (!appFile.includes('basename="/pdfspark"')) {
      throw new Error('App.tsx is missing Router basename="/pdfspark" configuration');
    }
    console.log('✅ Router configuration has correct basename');
    
    // Build the application
    await run('npm run build');
    console.log('✅ Build completed successfully');
    
    console.log('\nStep 2: Creating deployment configuration...');
    
    // Create specialized vercel.json for subdirectory hosting
    const vercelConfig = {
      "version": 2,
      "public": true,
      "cleanUrls": true,
      "trailingSlash": false,
      "rewrites": [
        { "source": "/pdfspark", "destination": "/index.html" },
        { "source": "/pdfspark/(.*)", "destination": "/$1" }
      ],
      "headers": [
        {
          "source": "/pdfspark/(.*)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=0, must-revalidate"
            }
          ]
        },
        {
          "source": "/pdfspark/assets/(.*)",
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
    console.log('✅ Created specialized vercel.json for subdirectory hosting');
    
    console.log('\nStep 3: Create deployment package...');
    
    // Create a ZIP file of the dist directory
    await run('cd dist && zip -r ../pdfspark-dist.zip *');
    console.log('✅ Created deployment package: pdfspark-dist.zip');
    
    console.log('\nStep 4: Link to main project...');
    
    // Create instructions file
    const instructions = `
# PDFSpark Integration Instructions

To integrate PDFSpark at quicksparks.dev/pdfspark, follow these steps:

1. In the Vercel dashboard, go to the main quicksparks.dev project (ID: ${mainProjectId})

2. Navigate to Settings > Rewrites and add these rewrites:
   - Source: /pdfspark
     Destination: /pdfspark/index.html
   - Source: /pdfspark/(.*)
     Destination: /pdfspark/$1

3. Extract the pdfspark-dist.zip to your main project's public directory:
   - Extract to: public/pdfspark/

4. Redeploy the main project or trigger a new build

5. Test the integration at:
   - https://www.quicksparks.dev/pdfspark/
   - https://www.quicksparks.dev/pdfspark/convert
   - https://www.quicksparks.dev/pdfspark/product

If any issues occur, check:
- That all paths in the rewrites are correctly configured
- That the assets are properly extracted to the public/pdfspark directory
- That the main Vercel project has the correct vercel.json configuration
`;
    
    fs.writeFileSync(
      path.join(__dirname, 'pdfspark-integration.md'),
      instructions
    );
    
    console.log('\n✅ Integration package and instructions created!');
    console.log('\nYou now have two options to deploy:');
    console.log('\n1. Manual integration:');
    console.log('   - Use the pdfspark-dist.zip file');
    console.log('   - Follow the instructions in pdfspark-integration.md');
    
    console.log('\n2. Direct deployment to a standalone project:');
    console.log('   - Run: npm run deploy:vercel');
    console.log('   - Then add the domain in Vercel dashboard');
    
    rl.close();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

deploy();