#!/usr/bin/env node

/**
 * Script to check redirects in a Vercel deployment
 * Shows the full redirect chain
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

console.log(`🔍 Checking redirects at: ${vercelUrl}`);

// Function to make an HTTP request that follows redirects manually
async function followRedirects(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    console.log(`🌐 Requesting: ${url}`);
    
    const handleRequest = (currentUrl, redirectCount) => {
      https.get(currentUrl, { headers: { 'User-Agent': 'PDFSpark-Redirect-Checker/1.0' } }, (res) => {
        console.log(`  ↪ Status: ${res.statusCode} (${res.statusMessage})`);
        console.log(`  ↪ Headers: ${JSON.stringify(res.headers, null, 2)}`);
        
        if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) && 
            res.headers.location && 
            redirectCount < maxRedirects) {
          
          // Handle relative URLs
          let nextUrl = res.headers.location;
          if (nextUrl.startsWith('/')) {
            const urlObj = new URL(currentUrl);
            nextUrl = `${urlObj.protocol}//${urlObj.host}${nextUrl}`;
          }
          
          console.log(`  ↪ Redirecting to: ${nextUrl}`);
          
          // Follow the redirect
          handleRequest(nextUrl, redirectCount + 1);
        } else {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            console.log(`  ↪ Final response: ${res.statusCode} (${res.statusMessage})`);
            console.log(`  ↪ Content preview: ${data.substring(0, 150).replace(/\n/g, ' ')}...`);
            
            resolve({
              finalUrl: currentUrl,
              statusCode: res.statusCode,
              headers: res.headers,
              content: data.substring(0, 500)
            });
          });
        }
      }).on('error', (err) => {
        console.error(`  ↪ Error: ${err.message}`);
        reject(err);
      });
    };
    
    // Start the request chain
    handleRequest(url, 0);
  });
}

// Main function
async function checkRedirects() {
  const routes = [
    '/',
    '/pdfspark',
    '/pdfspark/'
  ];
  
  const results = {};
  
  for (const route of routes) {
    console.log(`\n📍 Checking route: ${route}`);
    try {
      const result = await followRedirects(`${vercelUrl}${route}`);
      results[route] = {
        success: result.statusCode >= 200 && result.statusCode < 300,
        statusCode: result.statusCode,
        finalUrl: result.finalUrl
      };
      console.log(`✅ Completed check for ${route}`);
    } catch (error) {
      console.error(`❌ Failed to check ${route}: ${error.message}`);
      results[route] = {
        success: false,
        error: error.message
      };
    }
  }
  
  // Save results to file
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(__dirname, '..', 'deployment-logs', `redirect-check-${timestamp}.json`);
  
  // Create deployment-logs directory if it doesn't exist
  const logsDir = path.join(__dirname, '..', 'deployment-logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${reportPath}`);
  
  // Print summary
  console.log('\n===== REDIRECT CHECK SUMMARY =====');
  for (const [route, result] of Object.entries(results)) {
    console.log(`${route}: ${result.success ? '✅' : '❌'} ${result.statusCode || ''} ${result.error || ''}`);
  }
  console.log('================================');
}

checkRedirects().catch(error => {
  console.error('Error in redirect check:', error);
});