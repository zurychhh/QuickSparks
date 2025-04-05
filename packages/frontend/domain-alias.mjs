#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 PDFSpark Domain Alias Setup');
console.log('============================');

async function run(cmd) {
  console.log(`> ${cmd}`);
  const { stdout, stderr } = await execAsync(cmd);
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
  return { stdout, stderr };
}

async function setup() {
  try {
    console.log('Step 1: Checking deployment status...');
    
    // Get the latest deployment URL
    const deploymentInfoPath = path.join(__dirname, 'deployment-logs', 'last-successful-deploy.json');
    
    if (!fs.existsSync(deploymentInfoPath)) {
      throw new Error('No deployment information found. Please deploy first using npm run deploy:restructure');
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
    const deployUrl = deploymentInfo.url;
    
    console.log(`Latest deployment URL: ${deployUrl}`);
    
    console.log('\nStep 2: Adding domain alias in Vercel...');
    
    console.log(`\nTo complete the domain setup, you need to add a domain alias in Vercel:
    
1. Go to the Vercel dashboard and select your project
2. Go to "Settings" > "Domains"
3. Add "quicksparks.dev" as a domain
4. If it asks for configuration, select "I'm using a different provider"
5. In the project settings, go to "Rewrites" and add:
   - Source: /pdfspark
     Destination: /pdfspark/index.html
   - Source: /pdfspark/(.*)
     Destination: /pdfspark/$1

If you're still encountering 404 errors, try these steps:

1. Check the direct deployment URL with the pdfspark path:
   ${deployUrl}/pdfspark/

2. If that works, then it's a domain configuration issue:
   - Verify the domain "quicksparks.dev" is properly set up in Vercel
   - Check that the DNS records point to Vercel correctly
   - Make sure there are no conflicting projects using the same domain

3. Try forcing a fresh deployment:
   - Go to "Deployments" in Vercel dashboard
   - Find your latest deployment
   - Click the three dots menu and select "Redeploy"
`);
    
    console.log('\nStep 3: Creating a domain configuration test...');
    
    // Create a simple test script to check domain resolution
    const testScript = `
#!/usr/bin/env node

const https = require('https');

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    console.log(\`Testing URL: \${url}\`);
    
    const req = https.get(url, (res) => {
      console.log(\`Status: \${res.statusCode}\`);
      console.log(\`Headers: \${JSON.stringify(res.headers)}\`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 200) + '...' // First 200 chars
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function runTests() {
  try {
    // Test direct deployment URL
    await checkUrl('${deployUrl}');
    
    // Test subdirectory
    await checkUrl('${deployUrl}/pdfspark/');
    
    console.log('\\nTesting production domain...');
    
    // Test production domain
    await checkUrl('https://quicksparks.dev/pdfspark/');
    
    console.log('\\nTests completed!');
  } catch (error) {
    console.error('Error during tests:', error.message);
  }
}

runTests();
`;
    
    fs.writeFileSync(
      path.join(__dirname, 'domain-test.js'),
      testScript
    );
    
    console.log('✅ Created domain-test.js to help troubleshoot domain issues');
    console.log('   Run with: node domain-test.js');
    
    // Make the script executable
    fs.chmodSync(path.join(__dirname, 'domain-test.js'), '755');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setup();