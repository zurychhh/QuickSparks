#!/usr/bin/env node

/**
 * Deployment Status Check
 * This script comprehensively checks all deployment URLs and status
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 PDFSpark Deployment Status Check');
console.log('===================================');

// Read the last successful deploy URL
const deployInfoPath = path.join(__dirname, 'deployment-logs', 'last-successful-deploy.json');
const deployInfo = JSON.parse(fs.readFileSync(deployInfoPath, 'utf8'));
const deployUrl = deployInfo.url;

// URLs to test
const urlsToTest = [
  // Direct deployment URL
  deployUrl,
  `${deployUrl}/pdfspark`,
  `${deployUrl}/pdfspark/convert`,
  
  // Domain variants
  'https://quicksparks.dev',
  'https://quicksparks.dev/pdfspark',
  'https://quicksparks.dev/pdfspark/convert',
  'https://www.quicksparks.dev',
  'https://www.quicksparks.dev/pdfspark',
  'https://www.quicksparks.dev/pdfspark/convert',
  
  // Alternative published deployments (from verification logs)
  'https://dist-awirridfu-zurychhhs-projects.vercel.app',
  'https://dist-awirridfu-zurychhhs-projects.vercel.app/pdfspark',
  'https://public-deploy-g9qef7gwd-zurychhhs-projects.vercel.app',
  'https://public-deploy-g9qef7gwd-zurychhhs-projects.vercel.app/pdfspark'
];

// Function to check a URL with redirect following
async function checkUrl(url, followRedirects = true, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    console.log(`Testing URL: ${url}`);
    
    const req = https.get(url, (res) => {
      const { statusCode, headers } = res;
      console.log(`  Status: ${statusCode}`);
      
      // If we should follow redirects
      if (followRedirects && 
          (statusCode === 301 || statusCode === 302 || statusCode === 307 || statusCode === 308) && 
          headers.location && 
          maxRedirects > 0) {
        
        let redirectUrl = headers.location;
        
        // Resolve relative redirects
        if (!redirectUrl.startsWith('http')) {
          const baseUrl = new URL(url);
          redirectUrl = `${baseUrl.protocol}//${baseUrl.host}${redirectUrl}`;
        }
        
        console.log(`  Following redirect to: ${redirectUrl}`);
        
        return checkUrl(redirectUrl, followRedirects, maxRedirects - 1)
          .then(redirectResult => {
            // Add the redirect chain to the result
            redirectResult.redirectChain = redirectResult.redirectChain || [];
            redirectResult.redirectChain.unshift({
              originalUrl: url,
              statusCode,
              location: headers.location
            });
            
            resolve(redirectResult);
          })
          .catch(reject);
      }
      
      // Process the non-redirect response
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Detect whether this is likely an auth page
        const isAuthPage = 
          data.includes('Authentication Required') || 
          data.includes('Sign In') || 
          data.includes('login') ||
          data.includes('vercel.com/login');
        
        // Detect if this is likely a 404 page
        const is404Page = 
          data.includes('404') || 
          data.includes('not found') || 
          data.includes('Nothing to see here');
        
        const result = {
          url,
          finalUrl: url,
          status: statusCode,
          headers,
          isAuthPage,
          is404Page,
          dataPreview: data.substring(0, 100) + (data.length > 100 ? '...' : ''),
          success: statusCode >= 200 && statusCode < 300 && !isAuthPage && !is404Page,
          redirectChain: []
        };
        
        console.log(`  Success: ${result.success}`);
        if (isAuthPage) console.log('  Authentication page detected');
        if (is404Page) console.log('  404 page detected');
        
        resolve(result);
      });
    });
    
    req.on('error', (error) => {
      console.error(`  Error: ${error.message}`);
      reject({
        url,
        error: error.message,
        success: false,
        redirectChain: []
      });
    });
    
    req.end();
  });
}

// Test all URLs
async function checkAllUrls() {
  const results = [];
  
  console.log('Testing all deployment URLs...\n');
  
  for (const url of urlsToTest) {
    try {
      const result = await checkUrl(url);
      results.push(result);
      console.log(''); // Add spacing between URL checks
    } catch (error) {
      results.push({
        url,
        error: error.message,
        success: false,
        redirectChain: []
      });
      console.log(''); // Add spacing between URL checks
    }
  }
  
  // Save the report
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      totalUrls: results.length,
      successfulUrls: results.filter(r => r.success).length,
      authPages: results.filter(r => r.isAuthPage).length,
      notFoundPages: results.filter(r => r.is404Page).length,
      errors: results.filter(r => r.error).length
    }
  };
  
  const reportPath = path.join(__dirname, 'deployment-logs', `comprehensive-check-${new Date().toISOString().replace(/:/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n===== DEPLOYMENT STATUS SUMMARY =====');
  console.log(`Total URLs checked: ${report.summary.totalUrls}`);
  console.log(`Successful URLs: ${report.summary.successfulUrls}`);
  console.log(`Auth required pages: ${report.summary.authPages}`);
  console.log(`Not found pages: ${report.summary.notFoundPages}`);
  console.log(`Errors: ${report.summary.errors}`);
  console.log('=====================================');
  
  // Categorize working and non-working URLs
  const workingUrls = results.filter(r => r.success).map(r => r.url);
  const authUrls = results.filter(r => r.isAuthPage).map(r => r.url);
  const notFoundUrls = results.filter(r => r.is404Page).map(r => r.url);
  
  console.log('\nWorking URLs:');
  if (workingUrls.length > 0) {
    workingUrls.forEach(url => console.log(`✅ ${url}`));
  } else {
    console.log('❌ No working URLs found');
  }
  
  if (authUrls.length > 0) {
    console.log('\nAuth Required URLs:');
    authUrls.forEach(url => console.log(`🔒 ${url}`));
  }
  
  if (notFoundUrls.length > 0) {
    console.log('\nNot Found URLs:');
    notFoundUrls.forEach(url => console.log(`❌ ${url}`));
  }
  
  console.log(`\nDetailed report saved to: ${reportPath}`);
  
  // Return the report object
  return report;
}

// Run the check
checkAllUrls().then(report => {
  // Create a fix recommendations file
  const recommendations = `# PDFSpark Deployment Fix Recommendations

Based on the comprehensive deployment check completed on ${new Date().toLocaleString()}, here are the recommended fixes:

## Current Status

- Working URLs: ${report.summary.successfulUrls}/${report.summary.totalUrls}
- URLs requiring authentication: ${report.summary.authPages}
- URLs returning 404 (not found): ${report.summary.notFoundPages}
- URLs with errors: ${report.summary.errors}

## Identified Issues

1. **Vercel Deployment Limit**: We've hit the free tier limit of 100 deployments per day
2. **Domain Redirection**: quicksparks.dev redirects to www.quicksparks.dev, but the www subdomain is not properly configured
3. **Authentication Requirements**: Direct Vercel URLs require authentication

## Fix Recommendations

### Option 1: Wait for Quota Reset

- Wait until the Vercel deployment quota resets (typically 24 hours)
- Deploy the www subdomain fix using the deploy-www-fix.sh script
- Configure both apex and www domains in Vercel

### Option 2: Use Alternative Hosting

- Deploy to Netlify as an alternative to Vercel
- Create a netlify.toml configuration with proper redirects
- Deploy using the Netlify CLI

### Option 3: GitHub Pages Deployment

- Configure GitHub Pages for the repository
- Create a custom domain configuration
- Set up proper path prefixes

## Implementation Plan

1. Create Netlify deployment configuration
2. Deploy to Netlify as a fallback
3. Retry Vercel deployment after quota reset
4. Properly configure domain settings for both apex and www subdomains
5. Set up a GitHub Actions workflow for continuous deployment

## Verification Plan

After implementing the fix:
1. Test all URLs with the comprehensive check script
2. Verify both apex and www domain variants
3. Ensure proper routing with the /pdfspark path prefix
4. Confirm all assets load correctly (JavaScript, CSS, images)
`;

  fs.writeFileSync(
    path.join(__dirname, 'DEPLOYMENT_FIX_RECOMMENDATIONS.md'),
    recommendations
  );
  
  console.log('\nRecommendations document created at: /Users/user/conversion-microservices/packages/frontend/DEPLOYMENT_FIX_RECOMMENDATIONS.md');
});