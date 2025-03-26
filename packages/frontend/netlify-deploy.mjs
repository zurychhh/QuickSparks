#!/usr/bin/env node

/**
 * Netlify Deployment Script
 * Creates and deploys a Netlify-compatible version of the PDFSpark application
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 PDFSpark Netlify Deployment Utility');
console.log('=====================================');

// Create netlify deployment directory
const NETLIFY_DEPLOY_DIR = path.join(__dirname, 'netlify-deploy');
if (fs.existsSync(NETLIFY_DEPLOY_DIR)) {
  console.log('Cleaning existing netlify-deploy directory...');
  fs.rmSync(NETLIFY_DEPLOY_DIR, { recursive: true, force: true });
}

fs.mkdirSync(NETLIFY_DEPLOY_DIR, { recursive: true });
console.log(`Created netlify-deploy directory at ${NETLIFY_DEPLOY_DIR}`);

// Build the application if needed
console.log('Checking if build is needed...');
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  console.log('Building application...');
  execSync('npm run build', { stdio: 'inherit' });
}

// Copy the dist files
console.log('Copying dist files...');
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursive(path.join(__dirname, 'dist'), NETLIFY_DEPLOY_DIR);
console.log('Copied all dist files to netlify-deploy');

// Create netlify.toml configuration
console.log('Creating netlify.toml configuration...');
const netlifyConfig = `# Netlify configuration file for PDFSpark
[build]
  publish = "/"
  command = "echo 'Static deployment, skipping build'"

# Redirect for apex domain to www
[[redirects]]
  from = "https://quicksparks.dev/*"
  to = "https://www.quicksparks.dev/:splat"
  status = 301
  force = true

# Handle /pdfspark path prefix
[[redirects]]
  from = "/pdfspark"
  to = "/index.html"
  status = 200

[[redirects]]
  from = "/pdfspark/*"
  to = "/:splat"
  status = 200

# SPA redirect for client-side routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

# Asset caching
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
`;

fs.writeFileSync(
  path.join(NETLIFY_DEPLOY_DIR, 'netlify.toml'),
  netlifyConfig
);

// Create a deployment script
console.log('Creating deployment script...');
const deployScript = `#!/bin/bash

# Deploy to Netlify
cd "${NETLIFY_DEPLOY_DIR}"

echo "🚀 Deploying to Netlify..."
# First check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
  echo "Installing Netlify CLI..."
  npm install -g netlify-cli
fi

# Deploy to Netlify
netlify deploy --prod

echo "✅ Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Go to Netlify dashboard and add custom domains:"
echo "   - www.quicksparks.dev"
echo "   - quicksparks.dev"
echo "2. In domain settings, configure DNS settings as needed"
echo "3. Test https://www.quicksparks.dev/pdfspark/"
`;

const deployScriptPath = path.join(__dirname, 'deploy-netlify.sh');
fs.writeFileSync(deployScriptPath, deployScript);
fs.chmodSync(deployScriptPath, '755');

console.log('Created deploy-netlify.sh script');

// Create a verification script for Netlify
console.log('Creating verification script...');
const verifyScript = `#!/usr/bin/env node

import https from 'https';

// Function to test a URL with redirect following
async function testUrl(url, followRedirects = true, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    console.log(\`Testing URL: \${url}\`);
    
    const req = https.get(url, (res) => {
      console.log(\`Status: \${res.statusCode}\`);
      
      // If this is a redirect and we should follow
      if (followRedirects && 
          (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) && 
          res.headers.location && 
          maxRedirects > 0) {
        
        console.log(\`Following redirect to: \${res.headers.location}\`);
        
        // Resolve relative redirects
        const redirectUrl = res.headers.location.startsWith('http') 
          ? res.headers.location 
          : new URL(res.headers.location, url).href;
        
        // Follow the redirect
        return testUrl(redirectUrl, followRedirects, maxRedirects - 1)
          .then(resolve)
          .catch(reject);
      }
      
      // Otherwise, process the response
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Check for HTML content
        const isHtml = res.headers['content-type'] && 
                      res.headers['content-type'].includes('text/html');
        
        const result = {
          url: url,
          status: res.statusCode,
          headers: res.headers,
          isHtml,
          data: data.substr(0, 200) + (data.length > 200 ? '...' : ''),
          success: res.statusCode >= 200 && res.statusCode < 300
        };
        
        console.log(\`Success: \${result.success}\`);
        if (isHtml && data.length > 0) {
          console.log('HTML content detected');
        }
        
        resolve(result);
      });
    });
    
    req.on('error', (error) => {
      console.error(\`Error: \${error.message}\`);
      reject(error);
    });
    
    req.end();
  });
}

// Get Netlify URL from environment or arguments
async function getNetlifyUrl() {
  // Check for URL passed as argument
  if (process.argv.length > 2) {
    return process.argv[2];
  }
  
  // Ask for the URL
  console.log('Please provide the Netlify deployment URL:');
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question('Netlify URL: ', (url) => {
      readline.close();
      resolve(url);
    });
  });
}

// Test Netlify deployment
async function runTests() {
  try {
    const netlifyUrl = await getNetlifyUrl();
    console.log(\`Using Netlify URL: \${netlifyUrl}\`);
    
    // Test Netlify deployment
    console.log('\\n====== Testing Netlify Deployment ======');
    await testUrl(netlifyUrl);
    await testUrl(\`\${netlifyUrl}/pdfspark\`);
    await testUrl(\`\${netlifyUrl}/pdfspark/convert\`);
    
    // Test with custom domain if available
    console.log('\\n====== Testing Custom Domain (if available) ======');
    await testUrl('https://www.quicksparks.dev/pdfspark/');
    
    console.log('\\n✅ Testing completed!');
  } catch (error) {
    console.error('\\n❌ Testing failed:', error.message);
  }
}

runTests();
`;

const verifyScriptPath = path.join(__dirname, 'verify-netlify.mjs');
fs.writeFileSync(verifyScriptPath, verifyScript);
fs.chmodSync(verifyScriptPath, '755');

console.log('Created verify-netlify.mjs script');

// Update package.json to include new scripts
console.log('Updating package.json with new scripts...');
const mainPackageJsonPath = path.join(__dirname, 'package.json');
const mainPackageJson = JSON.parse(fs.readFileSync(mainPackageJsonPath, 'utf8'));

if (!mainPackageJson.scripts) {
  mainPackageJson.scripts = {};
}

mainPackageJson.scripts['deploy:netlify'] = './deploy-netlify.sh';
mainPackageJson.scripts['verify:netlify'] = 'node verify-netlify.mjs';

fs.writeFileSync(
  mainPackageJsonPath,
  JSON.stringify(mainPackageJson, null, 2)
);

// Create a README file with instructions
console.log('Creating README with detailed instructions...');
const readmeContent = `# PDFSpark Netlify Deployment

This package contains the Netlify deployment configuration for the PDFSpark application, created as an alternative to Vercel due to deployment limits.

## What This Provides

1. Creates a Netlify-compatible deployment with proper configuration
2. Sets up redirects for apex to www domain
3. Configures proper handling of the /pdfspark path prefix
4. Includes security headers and caching directives

## How to Deploy

1. Run the deployment script:
   \`\`\`
   npm run deploy:netlify
   \`\`\`

2. Follow the Netlify CLI prompts to authenticate and deploy
   - The CLI will provide a deployment URL when complete

3. After deployment, configure custom domains in the Netlify dashboard:
   - Add www.quicksparks.dev as the primary domain
   - Add quicksparks.dev as a domain alias
   - Configure DNS settings as prompted

4. Verify the deployment:
   \`\`\`
   npm run verify:netlify <netlify-url>
   \`\`\`

## Configuration Details

The deployment uses a netlify.toml file with the following key configurations:

1. Redirects for apex domain to www subdomain
2. Path prefix handling for /pdfspark
3. SPA redirects for client-side routing
4. Security headers configuration
5. Asset caching rules

## Best Practices

- Always deploy from the main branch for consistency
- Verify deployments after making changes
- Use the Netlify dashboard to monitor site status
- Set up continuous deployment with GitHub integration

## Troubleshooting

If you encounter issues:
1. Check the Netlify deployment logs in the dashboard
2. Verify DNS settings are correctly configured
3. Test redirects using curl or browser developer tools
4. Check for conflicting redirect rules
`;

fs.writeFileSync(path.join(NETLIFY_DEPLOY_DIR, 'README.md'), readmeContent);

// Create documentation about the Netlify option
const netlifyDocPath = path.join(__dirname, 'NETLIFY_DEPLOYMENT.md');
fs.writeFileSync(netlifyDocPath, readmeContent);

console.log(`
✅ Netlify Deployment Configuration created successfully!

Next steps:
1. Deploy to Netlify:
   npm run deploy:netlify

2. After deployment is complete:
   - Go to the Netlify dashboard
   - Configure custom domains for www.quicksparks.dev and quicksparks.dev
   - Set up DNS records as needed

3. Verify the deployment:
   npm run verify:netlify <netlify-url>

Documentation available at:
${netlifyDocPath}
`);