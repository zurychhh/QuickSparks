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
        const result = {
          url: url,
          status: res.statusCode,
          headers: res.headers,
          data: data.substr(0, 200) + (data.length > 200 ? '...' : ''),
          success: res.statusCode >= 200 && res.statusCode < 300
        };
        
        console.log(`Success: ${result.success}`);
        if (data.length > 0) {
          console.log('Data preview:', result.data);
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

// Test both domain versions
async function runTests() {
  try {
    // Test www subdomain
    console.log('\n====== Testing WWW Subdomain ======');
    await testUrl('https://www.quicksparks.dev/pdfspark/');
    await testUrl('https://www.quicksparks.dev/pdfspark/convert');
    
    // Test apex domain with redirect following
    console.log('\n====== Testing Apex Domain with Redirect Following ======');
    await testUrl('https://quicksparks.dev/pdfspark/');
    await testUrl('https://quicksparks.dev/pdfspark/convert');
    
    console.log('\n✅ Testing completed!');
  } catch (error) {
    console.error('\n❌ Testing failed:', error.message);
  }
}

runTests();
