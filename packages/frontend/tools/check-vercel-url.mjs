#!/usr/bin/env node

/**
 * Script to check if a Vercel deployment is accessible
 * This script is specifically for checking the direct Vercel URL
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the URL from command line arguments or use default
const vercelUrl = process.argv[2] || 'https://dist-j0ztdygd3-zurychhhs-projects.vercel.app';

console.log(`🔍 Checking Vercel deployment at: ${vercelUrl}`);

// Define routes to check
const baseRoutes = [
  '/',
  '/pdfspark',
  '/pdfspark/',
  '/pdfspark/convert',
  '/pdfspark/product',
  '/pdfspark/pricing',
  '/pdfspark/about'
];

// Function to make an HTTP request
async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 200)
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Main function to check all routes
async function checkVercelDeployment() {
  console.log('\nChecking routes...');
  const results = {};
  
  for (const route of baseRoutes) {
    const url = `${vercelUrl}${route}`;
    console.log(`  Making request to: ${url}`);
    
    try {
      const response = await makeRequest(url);
      console.log(`  Status: ${response.status} ${response.status >= 200 && response.status < 300 ? '✅' : '❌'}`);
      console.log(`  Response snippet: ${response.data.substring(0, 50)}...`);
      results[route] = {
        status: response.status,
        success: response.status >= 200 && response.status < 300,
        snippet: response.data.substring(0, 50)
      };
    } catch (error) {
      console.error(`  Error checking ${url}: ${error.message}`);
      results[route] = {
        status: 'Error',
        success: false,
        error: error.message
      };
    }
    console.log();
  }
  
  // Save results
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportFilePath = path.join(__dirname, '..', 'deployment-logs', `vercel-direct-check-${timestamp}.json`);
  
  // Create deployment-logs directory if it doesn't exist
  const logsDir = path.join(__dirname, '..', 'deployment-logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportFilePath, JSON.stringify(results, null, 2));
  console.log(`Results saved to: ${reportFilePath}`);
  
  // Output summary
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalCount = Object.keys(results).length;
  
  console.log('\n===== VERCEL DEPLOYMENT CHECK SUMMARY =====');
  console.log(`Successful routes: ${successCount}/${totalCount}`);
  console.log('===========================================');
  console.log(`Overall Status: ${successCount > 0 ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log('===========================================');
}

checkVercelDeployment().catch(error => {
  console.error('Error during verification:', error);
  process.exit(1);
});