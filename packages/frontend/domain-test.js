
#!/usr/bin/env node

const https = require('https');

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    console.log(`Testing URL: ${url}`);
    
    const req = https.get(url, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers: ${JSON.stringify(res.headers)}`);
      
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
    await checkUrl('https://dist-642u13vwq-zurychhhs-projects.vercel.app');
    
    // Test subdirectory
    await checkUrl('https://dist-642u13vwq-zurychhhs-projects.vercel.app/pdfspark/');
    
    console.log('\nTesting production domain...');
    
    // Test production domain
    await checkUrl('https://quicksparks.dev/pdfspark/');
    
    console.log('\nTests completed!');
  } catch (error) {
    console.error('Error during tests:', error.message);
  }
}

runTests();
