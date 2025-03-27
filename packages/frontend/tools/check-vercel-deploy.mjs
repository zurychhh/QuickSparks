#!/usr/bin/env node

/**
 * Vercel Deployment Verification Script
 * Tests the Vercel-deployed PDFSpark application
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the last successful deploy URL
const deployInfo = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../deployment-logs/last-successful-deploy.json'),
  'utf8'
));

// Configuration
const DEPLOYED_URL = deployInfo.url;
const ROUTES_TO_CHECK = [
  '/',
  '/pdfspark',
  '/pdfspark/convert',
  '/pdfspark/product',
  '/pdfspark/pricing',
  '/pdfspark/about'
];
const REPORT_PATH = path.join(__dirname, '../deployment-logs', `vercel-verification-${new Date().toISOString().replace(/:/g, '-')}.json`);

/**
 * Fetch a URL and return the response data
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    console.log(`  Making request to: ${url}`);
    
    const request = https.get(url, (response) => {
      const { statusCode, headers } = response;
      console.log(`  Response: ${statusCode}`);
      
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve({
          url,
          status: statusCode,
          headers,
          data: data.length > 500 ? `${data.substring(0, 500)}...` : data,
          success: statusCode >= 200 && statusCode < 300
        });
      });
    });
    
    request.on('error', (error) => {
      reject({
        url,
        error: error.message,
        success: false
      });
    });
    
    request.end();
  });
}

/**
 * Check a route and return the result
 */
async function checkRoute(route) {
  const url = `${DEPLOYED_URL}${route}`;
  console.log(`Checking route: ${url}`);
  
  try {
    const result = await fetchUrl(url);
    console.log(`  Status: ${result.status} ${result.success ? '✅' : '❌'}`);
    
    // Check if the response contains HTML
    if (result.success) {
      const isHtml = result.data.includes('<!DOCTYPE html>') || 
                    result.data.includes('<html>') ||
                    result.data.includes('<body>');
      
      console.log(`  Response type: ${isHtml ? 'HTML' : 'Not HTML'}`);
      result.isHtml = isHtml;
    }
    
    return result;
  } catch (error) {
    console.error(`  Failed: ${error.message}`);
    return {
      url,
      error: error.message,
      success: false
    };
  }
}

/**
 * Check all routes
 */
async function checkDeployment() {
  console.log(`\n🔍 Checking Vercel deployment at: ${DEPLOYED_URL}\n`);
  
  // Check routes
  console.log('Checking routes...');
  const routeResults = [];
  
  for (const route of ROUTES_TO_CHECK) {
    try {
      const result = await checkRoute(route);
      routeResults.push(result);
    } catch (error) {
      routeResults.push({
        url: `${DEPLOYED_URL}${route}`,
        error: error.message,
        success: false
      });
    }
  }
  
  // Create the report
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: DEPLOYED_URL,
    results: {
      routes: {
        results: routeResults,
        success: routeResults.some(r => r.success)
      }
    }
  };
  
  // Determine overall success
  report.approved = report.results.routes.success;
  
  // Save the report
  console.log(`\nSaving report to: ${REPORT_PATH}`);
  const reportDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  
  // Print the summary
  console.log('\n===== VERCEL DEPLOYMENT VERIFICATION SUMMARY =====');
  console.log(`Routes: ${report.results.routes.success ? '✅ (at least one works)' : '❌ (none work)'}`);
  console.log('===========================================');
  console.log(`Overall Status: ${report.approved ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log('===========================================\n');
  
  return report.approved ? 0 : 1;
}

// Run the function if this is the main module
if (import.meta.url.endsWith(process.argv[1])) {
  checkDeployment().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export default checkDeployment;