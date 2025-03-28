#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Tests the deployed PDFSpark application without requiring Selenium
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DEPLOYED_URL = 'https://quicksparks.dev/pdfspark';
const ROUTES_TO_CHECK = [
  '/',
  '/convert',
  '/product',
  '/pricing',
  '/about',
  '/health'
];
const ASSETS_TO_CHECK = [
  '/assets/index-C3bLptlz.css',
  '/assets/index-COef_Mgr.js',
  '/assets/react-BKU87Gzz.js',
  '/assets/router-B_sUl22Z.js',
  '/assets/zustand-CzsH10Ka.js',
  '/favicon.svg',
  '/logo.svg'
];
const REPORT_PATH = path.join(__dirname, '../deployment-logs', `verification-${new Date().toISOString().replace(/:/g, '-')}.json`);

/**
 * Fetch a URL and return the response data
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      const { statusCode, headers } = response;
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve({
          url,
          status: statusCode,
          headers,
          data: data.length > 1000 ? `${data.substring(0, 1000)}...` : data,
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
 * Check all routes and assets
 */
async function checkDeployment() {
  console.log(`\n🔍 Checking deployment at: ${DEPLOYED_URL}\n`);
  
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
  
  // Check assets
  console.log('\nChecking assets...');
  const assetResults = [];
  
  for (const asset of ASSETS_TO_CHECK) {
    try {
      const result = await checkRoute(asset);
      assetResults.push(result);
    } catch (error) {
      assetResults.push({
        url: `${DEPLOYED_URL}${asset}`,
        error: error.message,
        success: false
      });
    }
  }
  
  // Check security headers
  console.log('\nChecking security headers...');
  const mainPageResult = routeResults.find(r => r.url === `${DEPLOYED_URL}/`);
  const securityHeaders = {
    'Strict-Transport-Security': mainPageResult?.headers?.['strict-transport-security'] || null,
    'Content-Security-Policy': mainPageResult?.headers?.['content-security-policy'] || null,
    'X-Content-Type-Options': mainPageResult?.headers?.['x-content-type-options'] || null,
    'X-Frame-Options': mainPageResult?.headers?.['x-frame-options'] || null,
    'X-XSS-Protection': mainPageResult?.headers?.['x-xss-protection'] || null,
    'Referrer-Policy': mainPageResult?.headers?.['referrer-policy'] || null,
    'Permissions-Policy': mainPageResult?.headers?.['permissions-policy'] || null
  };
  
  console.log('Security headers:', JSON.stringify(securityHeaders, null, 2));
  
  // Check if required files exist
  console.log('\nChecking required files...');
  const robotsTxtResult = await checkRoute('/robots.txt');
  const sitemapXmlResult = await checkRoute('/sitemap.xml');
  
  // Create the report
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: DEPLOYED_URL,
    results: {
      routes: {
        results: routeResults,
        success: routeResults.every(r => r.success)
      },
      assets: {
        results: assetResults,
        success: assetResults.every(r => r.success)
      },
      securityHeaders: {
        headers: securityHeaders,
        success: securityHeaders['Strict-Transport-Security'] !== null
      },
      requiredFiles: {
        robotsTxt: robotsTxtResult.success,
        sitemapXml: sitemapXmlResult.success,
        success: robotsTxtResult.success && sitemapXmlResult.success
      }
    },
    approved: false
  };
  
  // Determine overall success
  const allChecksSucceeded = 
    report.results.routes.success &&
    report.results.assets.success &&
    report.results.securityHeaders.success &&
    report.results.requiredFiles.success;
    
  report.approved = allChecksSucceeded;
  
  // Save the report
  console.log(`\nSaving report to: ${REPORT_PATH}`);
  const reportDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  
  // Print the summary
  console.log('\n===== DEPLOYMENT VERIFICATION SUMMARY =====');
  console.log(`Routes: ${report.results.routes.success ? '✅' : '❌'}`);
  console.log(`Assets: ${report.results.assets.success ? '✅' : '❌'}`);
  console.log(`Security Headers: ${report.results.securityHeaders.success ? '✅' : '❌'}`);
  console.log(`Required Files: ${report.results.requiredFiles.success ? '✅' : '❌'}`);
  console.log('===========================================');
  console.log(`Overall Status: ${report.approved ? 'APPROVED ✅' : 'FAILED ❌'}`);
  console.log('===========================================\n');
  
  if (report.approved) {
    // Update the last successful deploy file
    const lastSuccessfulDeploy = {
      timestamp: new Date().toISOString(),
      url: DEPLOYED_URL,
      buildSucceeded: true
    };
    
    fs.writeFileSync(
      path.join(reportDir, 'last-successful-deploy.json'),
      JSON.stringify(lastSuccessfulDeploy, null, 2)
    );
    
    console.log('Deployment verification SUCCESSFUL!');
    return 0;
  } else {
    console.log('Deployment verification FAILED!');
    return 1;
  }
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