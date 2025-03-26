#!/usr/bin/env node

/**
 * Script to check a deployment URL for PDFSpark
 * This script makes HTTP requests to the given URL and checks various paths
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the URL from command line arguments or use the last deployed URL
let vercelUrl = process.argv[2];

// If no URL provided, try to get it from the last deployment
if (!vercelUrl) {
  try {
    const deploymentJsonPath = path.join(__dirname, '..', 'deployment-logs', 'pdfspark-deployment.json');
    if (fs.existsSync(deploymentJsonPath)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentJsonPath, 'utf8'));
      vercelUrl = deployment.url;
      console.log(`Using last deployed URL from logs: ${vercelUrl}`);
    } else {
      console.error('No deployment URL provided and no deployment logs found');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error reading deployment logs:', error.message);
    process.exit(1);
  }
}

// Optional configuration for testing with or without /pdfspark
const testWithPdfspark = process.argv.includes('--with-pdfspark');
const testWithoutPdfspark = process.argv.includes('--without-pdfspark');

// Add /pdfspark if not present and not explicitly testing without it
if (!vercelUrl.endsWith('/pdfspark') && !testWithoutPdfspark) {
  vercelUrl = `${vercelUrl}/pdfspark`;
}

// Remove /pdfspark if explicitly testing without it
if (vercelUrl.endsWith('/pdfspark') && testWithoutPdfspark) {
  vercelUrl = vercelUrl.replace('/pdfspark', '');
}

console.log(`🔍 Checking deployment at: ${vercelUrl}`);

// Define paths to check
const pathsToCheck = [
  '',  // Root pdfspark path
  '/convert',
  '/pricing',
  '/about',
  '/product'
];

// Function to make HTTP requests
async function checkUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, res => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 200),
          redirect: res.headers.location
        });
      });
    });
    
    req.on('error', error => {
      reject(error);
    });
    
    req.end();
  });
}

// Function to check all paths
async function checkAllPaths() {
  const results = {};
  let allSuccessful = true;
  
  console.log('\nTesting paths:');
  
  for (const pathSuffix of pathsToCheck) {
    const fullUrl = `${vercelUrl}${pathSuffix}`;
    console.log(`\nChecking: ${fullUrl}`);
    
    try {
      const response = await checkUrl(fullUrl);
      
      console.log(`Status: ${response.statusCode} ${response.statusCode >= 200 && response.statusCode < 300 ? '✅' : '❌'}`);
      
      if (response.statusCode >= 300 && response.statusCode < 400 && response.redirect) {
        console.log(`Redirects to: ${response.redirect}`);
      }
      
      if (response.data) {
        console.log(`Response preview: ${response.data.substring(0, 50).replace(/\n/g, ' ')}...`);
      }
      
      if (response.statusCode === 200) {
        // Check if response contains expected HTML structure
        const hasHtmlStructure = response.data.includes('<!DOCTYPE html>') || 
                                response.data.includes('<html') || 
                                response.data.includes('<body');
        
        console.log(`Contains HTML: ${hasHtmlStructure ? '✅' : '❌'}`);
        
        // Check if it's the actual app (contains something app-specific)
        const isActualApp = response.data.includes('PDFSpark') || 
                           response.data.includes('QuickSparks') ||
                           response.data.includes('react');
        
        console.log(`Contains app content: ${isActualApp ? '✅' : '❌'}`);
        
        // Overall success determination
        const pathSuccess = hasHtmlStructure && isActualApp;
        console.log(`Path verification: ${pathSuccess ? '✅ PASSED' : '❌ FAILED'}`);
        
        allSuccessful = allSuccessful && pathSuccess;
      } else {
        // If not 200, it's a failure
        console.log(`Path verification: ❌ FAILED (non-200 status)`);
        allSuccessful = false;
      }
      
      results[pathSuffix] = {
        fullUrl,
        statusCode: response.statusCode,
        success: response.statusCode === 200,
      };
    } catch (error) {
      console.error(`Error checking ${fullUrl}:`, error.message);
      results[pathSuffix] = {
        fullUrl,
        error: error.message,
        success: false
      };
      allSuccessful = false;
    }
  }
  
  // Save results
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportFilePath = path.join(__dirname, '..', 'deployment-logs', `url-check-${timestamp}.json`);
  
  // Create deployment-logs directory if it doesn't exist
  const logsDir = path.join(__dirname, '..', 'deployment-logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportFilePath, JSON.stringify({
    vercelUrl,
    timestamp: new Date().toISOString(),
    results,
    allSuccessful
  }, null, 2));
  
  console.log(`\nResults saved to: ${reportFilePath}`);
  
  // Final summary
  console.log('\n===== DEPLOYMENT VERIFICATION SUMMARY =====');
  console.log(`Deployment URL: ${vercelUrl}`);
  console.log(`Paths tested: ${Object.keys(results).length}`);
  console.log(`Paths successful: ${Object.values(results).filter(r => r.success).length}`);
  console.log(`Overall status: ${allSuccessful ? '✅ VERIFIED' : '❌ FAILED'}`);
  console.log('===========================================');
  
  return allSuccessful;
}

// Run the checks
checkAllPaths()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Verification failed with error:', error);
    process.exit(1);
  });