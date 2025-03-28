import https from 'https';

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    console.log(`Testing URL: ${url}`);
    
    const req = https.get(url, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (data.length > 0) {
          console.log(`Data preview: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
        } else {
          console.log('No data received in response body');
        }
        
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      console.error(`Error: ${error.message}`);
      reject(error);
    });
    
    req.end();
  });
}

async function runTests() {
  try {
    const deployUrl = "https://dist-awirridfu-zurychhhs-projects.vercel.app";
    
    // Test direct deployment URL
    console.log("\n1. Testing direct deployment URL:");
    await checkUrl(deployUrl);
    
    // Test subdirectory
    console.log("\n2. Testing subdirectory on deployment URL:");
    await checkUrl(`${deployUrl}/pdfspark/`);
    
    console.log('\n3. Testing production domain...');
    
    // Test production domain
    await checkUrl('https://quicksparks.dev/pdfspark/');
    
    // Test www. redirect issue
    console.log('\n4. Testing www subdomain (to check redirect issue)...');
    await checkUrl('https://www.quicksparks.dev/pdfspark/');
    
    console.log('\nTests completed!');
  } catch (error) {
    console.error('Error during tests:', error.message);
  }
}

runTests();