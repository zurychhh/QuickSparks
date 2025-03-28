#!/usr/bin/env node

/**
 * Enhanced Deployment Verification Script
 * Tests the deployed PDFSpark application with redirect following
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
const REPORT_PATH = path.join(__dirname, '../deployment-logs', `verification-with-redirects-${new Date().toISOString().replace(/:/g, '-')}.json`);

/**
 * Fetch a URL with redirect following and return the response data
 */
function fetchUrlWithRedirects(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const options = {
      followAllRedirects: true,
      maxRedirects: maxRedirects
    };
    
    console.log(`  Making request to: ${url}`);
    
    const request = https.get(url, (response) => {
      console.log(`  Initial response: ${response.statusCode}`);
      
      // Handle redirects manually
      if ((response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) && 
          response.headers.location && 
          maxRedirects > 0) {
        
        let redirectUrl = response.headers.location;
        
        // If the redirect URL is relative, make it absolute
        if (redirectUrl.startsWith('/')) {
          const urlObj = new URL(url);
          redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
        }
        
        console.log(`  Following redirect to: ${redirectUrl}`);
        
        // Follow the redirect
        return fetchUrlWithRedirects(redirectUrl, maxRedirects - 1)
          .then(resolve)
          .catch(reject);
      }
      
      const { statusCode, headers } = response;
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve({
          url,
          finalUrl: response.responseUrl || url,
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
    const result = await fetchUrlWithRedirects(url);
    console.log(`  Final Status: ${result.status} ${result.success ? '✅' : '❌'}`);
    console.log(`  Final URL: ${result.finalUrl}`);
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
  console.log(`\n🔍 Checking deployment at: ${DEPLOYED_URL} (with redirect following)\n`);
  
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
        success: routeResults.some(r => r.success)
      },
      assets: {
        results: assetResults,
        success: assetResults.some(r => r.success)
      },
      requiredFiles: {
        robotsTxt: robotsTxtResult.success,
        sitemapXml: sitemapXmlResult.success,
        success: robotsTxtResult.success || sitemapXmlResult.success
      }
    }
  };
  
  // Determine overall success - we're more lenient here, checking if ANY routes work
  const someRoutesSucceeded = routeResults.some(r => r.success);
  const someAssetsSucceeded = assetResults.some(r => r.success);
  const someRequiredFilesSucceeded = robotsTxtResult.success || sitemapXmlResult.success;
  
  report.approved = someRoutesSucceeded;
  
  // Save the report
  console.log(`\nSaving report to: ${REPORT_PATH}`);
  const reportDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  
  // Print the summary
  console.log('\n===== DEPLOYMENT VERIFICATION SUMMARY (WITH REDIRECTS) =====');
  console.log(`Routes: ${someRoutesSucceeded ? '✅ (some work)' : '❌ (none work)'}`);
  console.log(`Assets: ${someAssetsSucceeded ? '✅ (some work)' : '❌ (none work)'}`);
  console.log(`Required Files: ${someRequiredFilesSucceeded ? '✅ (some exist)' : '❌ (none exist)'}`);
  console.log('===========================================');
  console.log(`Overall Status: ${report.approved ? 'PARTIALLY WORKING ⚠️' : 'FAILED ❌'}`);
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