#!/usr/bin/env node

// Deployment verification script
import https from 'https';
import http from 'http';

const DEPLOYMENT_URL = 'https://public-deploy-g9qef7gwd-zurychhhs-projects.vercel.app';
const ASSET_PATHS = [
  '/',
  '/assets/index-C3bLptlz.css',
  '/assets/index-COef_Mgr.js',
  '/assets/react-BKU87Gzz.js',
  '/assets/router-B_sUl22Z.js',
  '/assets/zustand-CzsH10Ka.js'
];

console.log(`🔍 Verifying deployment at: ${DEPLOYMENT_URL}\n`);

async function checkUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          contentType: res.headers['content-type'],
          url: url,
          data: data.length > 100 ? `${data.substring(0, 100)}...` : data
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

async function main() {
  // Check the main page
  try {
    const mainPageResult = await checkUrl(DEPLOYMENT_URL);
    console.log(`Main page (${DEPLOYMENT_URL}):`);
    console.log(`  Status: ${mainPageResult.statusCode}`);
    console.log(`  Content-Type: ${mainPageResult.contentType}`);
    
    if (mainPageResult.statusCode !== 200) {
      console.log(`❌ Main page returned status ${mainPageResult.statusCode}`);
      return false;
    }
    
    if (!mainPageResult.contentType?.includes('text/html')) {
      console.log(`❌ Main page has incorrect content type: ${mainPageResult.contentType}`);
      return false;
    }
    
    console.log(`✅ Main page loaded successfully\n`);
    
    // Check asset paths
    let allAssetsValid = true;
    
    for (const assetPath of ASSET_PATHS.slice(1)) { // Skip the first one which is the main page
      try {
        const assetUrl = `${DEPLOYMENT_URL}${assetPath}`;
        const assetResult = await checkUrl(assetUrl);
        
        console.log(`Asset (${assetPath}):`);
        console.log(`  Status: ${assetResult.statusCode}`);
        console.log(`  Content-Type: ${assetResult.contentType}`);
        
        if (assetResult.statusCode !== 200) {
          console.log(`❌ Asset returned status ${assetResult.statusCode}`);
          allAssetsValid = false;
          continue;
        }
        
        if (assetPath.endsWith('.js') && !assetResult.contentType?.includes('javascript')) {
          console.log(`❌ JavaScript asset has incorrect content type: ${assetResult.contentType}`);
          allAssetsValid = false;
          continue;
        }
        
        if (assetPath.endsWith('.css') && !assetResult.contentType?.includes('css')) {
          console.log(`❌ CSS asset has incorrect content type: ${assetResult.contentType}`);
          allAssetsValid = false;
          continue;
        }
        
        console.log(`✅ Asset loaded successfully\n`);
      } catch (error) {
        console.log(`❌ Failed to load asset (${assetPath}): ${error.message}`);
        allAssetsValid = false;
      }
    }
    
    // Check client-side routing
    const routeUrl = `${DEPLOYMENT_URL}/pdfspark/convert`;
    try {
      const routeResult = await checkUrl(routeUrl);
      console.log(`Route (${routeUrl}):`);
      console.log(`  Status: ${routeResult.statusCode}`);
      console.log(`  Content-Type: ${routeResult.contentType}`);
      
      if (routeResult.statusCode !== 200) {
        console.log(`❌ Route returned status ${routeResult.statusCode}`);
        return false;
      }
      
      console.log(`✅ Route returns the main application\n`);
    } catch (error) {
      console.log(`❌ Failed to check route: ${error.message}`);
      return false;
    }
    
    // Final verdict
    if (allAssetsValid) {
      console.log(`✅ All checks passed! Deployment appears to be working correctly.`);
      return true;
    } else {
      console.log(`❌ Some assets failed to load correctly.`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Verification failed: ${error.message}`);
    return false;
  }
}

main()
  .then(result => {
    if (!result) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });