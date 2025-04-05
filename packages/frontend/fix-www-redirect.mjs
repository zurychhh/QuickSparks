#!/usr/bin/env node

/**
 * Fix WWW Redirect Issue
 * This script creates a proper deployment configuration for www.quicksparks.dev/pdfspark
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 PDFSpark WWW Subdomain Fix Utility');
console.log('=====================================');

// Create deployment directory for www subdomain
const WWW_DEPLOY_DIR = path.join(__dirname, 'www-deploy');
if (fs.existsSync(WWW_DEPLOY_DIR)) {
  console.log('Cleaning existing www-deploy directory...');
  fs.rmSync(WWW_DEPLOY_DIR, { recursive: true, force: true });
}

fs.mkdirSync(WWW_DEPLOY_DIR, { recursive: true });
console.log(`Created www-deploy directory at ${WWW_DEPLOY_DIR}`);

// Copy the dist files
console.log('Copying dist files...');
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  console.log('Building application first...');
  execSync('npm run build', { stdio: 'inherit' });
}

// Get list of files in dist directory
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

copyRecursive(path.join(__dirname, 'dist'), WWW_DEPLOY_DIR);
console.log('Copied all dist files to www-deploy');

// Create package.json for Vercel
console.log('Creating package.json for Vercel...');
const packageJson = {
  "name": "pdfspark-www",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "echo 'Static deployment, no build needed'"
  }
};

fs.writeFileSync(
  path.join(WWW_DEPLOY_DIR, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Create vercel.json with proper configuration
console.log('Creating vercel.json with correct www configuration...');
const vercelConfig = {
  "version": 2,
  "public": true,
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/pdfspark",
      "destination": "/pdfspark/index.html"
    },
    {
      "source": "/pdfspark/(.*)",
      "destination": "/pdfspark/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
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
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    },
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
  path.join(WWW_DEPLOY_DIR, 'vercel.json'),
  JSON.stringify(vercelConfig, null, 2)
);

// Create a deployment script
console.log('Creating deployment script...');
const deployScript = `#!/bin/bash

# Deploy the www subdomain fix to Vercel
cd "${WWW_DEPLOY_DIR}"

echo "🚀 Deploying www subdomain fix to Vercel..."
vercel deploy --prod --yes

echo "✅ Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Go to Vercel dashboard and add www.quicksparks.dev as a domain to this project"
echo "2. In domain settings, copy the verification records and add them to your DNS configuration"
echo "3. Wait for DNS propagation and domain verification"
echo "4. Test https://www.quicksparks.dev/pdfspark/"
`;

const deployScriptPath = path.join(__dirname, 'deploy-www-fix.sh');
fs.writeFileSync(deployScriptPath, deployScript);
fs.chmodSync(deployScriptPath, '755');

console.log('Created deploy-www-fix.sh script');

// Create a verification script
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
        const result = {
          url: url,
          status: res.statusCode,
          headers: res.headers,
          data: data.substr(0, 200) + (data.length > 200 ? '...' : ''),
          success: res.statusCode >= 200 && res.statusCode < 300
        };
        
        console.log(\`Success: \${result.success}\`);
        if (data.length > 0) {
          console.log('Data preview:', result.data);
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

// Test both domain versions
async function runTests() {
  try {
    // Test www subdomain
    console.log('\\n====== Testing WWW Subdomain ======');
    await testUrl('https://www.quicksparks.dev/pdfspark/');
    await testUrl('https://www.quicksparks.dev/pdfspark/convert');
    
    // Test apex domain with redirect following
    console.log('\\n====== Testing Apex Domain with Redirect Following ======');
    await testUrl('https://quicksparks.dev/pdfspark/');
    await testUrl('https://quicksparks.dev/pdfspark/convert');
    
    console.log('\\n✅ Testing completed!');
  } catch (error) {
    console.error('\\n❌ Testing failed:', error.message);
  }
}

runTests();
`;

const verifyScriptPath = path.join(__dirname, 'verify-www-fix.mjs');
fs.writeFileSync(verifyScriptPath, verifyScript);
fs.chmodSync(verifyScriptPath, '755');

console.log('Created verify-www-fix.mjs script');

// Update package.json to include new scripts
console.log('Updating package.json with new scripts...');
const mainPackageJsonPath = path.join(__dirname, 'package.json');
const mainPackageJson = JSON.parse(fs.readFileSync(mainPackageJsonPath, 'utf8'));

if (!mainPackageJson.scripts) {
  mainPackageJson.scripts = {};
}

mainPackageJson.scripts['fix:www'] = 'node fix-www-redirect.mjs';
mainPackageJson.scripts['deploy:www'] = './deploy-www-fix.sh';
mainPackageJson.scripts['verify:www'] = 'node verify-www-fix.mjs';

fs.writeFileSync(
  mainPackageJsonPath,
  JSON.stringify(mainPackageJson, null, 2)
);

// Create a README file with instructions
console.log('Creating README with detailed instructions...');
const readmeContent = `# PDFSpark WWW Subdomain Fix

This package contains the fix for the www.quicksparks.dev/pdfspark deployment issue where accessing through the www subdomain was resulting in 404 errors.

## What This Fix Does

1. Creates a separate Vercel deployment specifically for the www subdomain
2. Properly configures the path prefix settings for /pdfspark
3. Sets up the correct security headers and caching rules
4. Provides verification tools to ensure both apex domain and www subdomain work correctly

## How to Deploy

1. Run the deployment script:
   \`\`\`
   npm run deploy:www
   \`\`\`

2. After deployment, go to the Vercel dashboard and add the www.quicksparks.dev domain to this new project
   - Look for domain verification instructions
   - Add any required DNS records
   - Wait for DNS propagation (may take a few minutes to a few hours)

3. Verify the deployment:
   \`\`\`
   npm run verify:www
   \`\`\`

## Testing

After deployment, verify that both these URLs work:
- https://www.quicksparks.dev/pdfspark/
- https://quicksparks.dev/pdfspark/

## Common Issues

- **DNS Propagation**: Changes to DNS settings can take time to propagate
- **Domain Verification**: Ensure all verification records are properly added
- **Route Configuration**: If routes aren't working, check the vercel.json rewrites
- **Conflicting Projects**: Ensure no other Vercel projects are using the same domain

## Long-term Solution

For a more permanent solution, consider:
1. Consolidating the deployments into a single Vercel project
2. Setting up automated deployment through CI/CD
3. Properly configuring both apex and www domains in a single configuration
`;

fs.writeFileSync(path.join(WWW_DEPLOY_DIR, 'README.md'), readmeContent);

// Create documentation about the fix
const fixDocPath = path.join(__dirname, 'WWW_REDIRECT_FIX.md');
fs.writeFileSync(fixDocPath, readmeContent);

console.log(`
✅ WWW Subdomain Fix created successfully!

Next steps:
1. Deploy the fix:
   npm run deploy:www

2. After deployment is complete, go to Vercel dashboard:
   - Find the new deployment project
   - Go to "Settings" > "Domains"
   - Add "www.quicksparks.dev" as a domain
   - Add any verification DNS records if needed

3. Verify the fix:
   npm run verify:www

Documentation available at:
${fixDocPath}
`);