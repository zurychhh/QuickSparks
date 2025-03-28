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
    const deployUrl = "https://dist-awirridfu-zurychhhs-projects.vercel.app";
    
    // Test direct deployment URL
    console.log("\nTesting direct deployment URL:");
    await checkUrl(deployUrl);
    
    // Test subdirectory
    console.log("\nTesting subdirectory on deployment URL:");
    await checkUrl(`${deployUrl}/pdfspark/`);
    
    console.log('\nTesting production domain...');
    
    // Test production domain
    await checkUrl('https://quicksparks.dev/pdfspark/');
    
    // Test www. redirect issue
    console.log('\nTesting www subdomain (to check redirect issue)...');
    await checkUrl('https://www.quicksparks.dev/pdfspark/');
    
    console.log('\nTests completed!');
  } catch (error) {
    console.error('Error during tests:', error.message);
  }
}

runTests();