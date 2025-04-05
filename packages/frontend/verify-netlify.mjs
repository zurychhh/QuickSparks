#!/usr/bin/env node

import https from 'https';

// Function to test a URL with redirect following
async function testUrl(url, followRedirects = true, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    console.log(`Testing URL: ${url}`);
    
    const req = https.get(url, (res) => {
      console.log(`Status: ${res.statusCode}`);
      
      // If this is a redirect and we should follow
      if (followRedirects && 
          (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) && 
          res.headers.location && 
          maxRedirects > 0) {
        
        console.log(`Following redirect to: ${res.headers.location}`);
        
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
        
        console.log(`Success: ${result.success}`);
        if (isHtml && data.length > 0) {
          console.log('HTML content detected');
        }
        
        resolve(result);
      });
    });
    
    req.on('error', (error) => {
      console.error(`Error: ${error.message}`);
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
    console.log(`Using Netlify URL: ${netlifyUrl}`);
    
    // Test Netlify deployment
    console.log('\n====== Testing Netlify Deployment ======');
    await testUrl(netlifyUrl);
    await testUrl(`${netlifyUrl}/pdfspark`);
    await testUrl(`${netlifyUrl}/pdfspark/convert`);
    
    // Test with custom domain if available
    console.log('\n====== Testing Custom Domain (if available) ======');
    await testUrl('https://www.quicksparks.dev/pdfspark/');
    
    console.log('\n✅ Testing completed!');
  } catch (error) {
    console.error('\n❌ Testing failed:', error.message);
  }
}

runTests();
