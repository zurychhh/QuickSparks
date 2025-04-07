#!/usr/bin/env node

/**
 * Post-build script to ensure Google verification files are properly placed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Running post-build verification for Google Search Console...');

// Ensure files exist in the right locations
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  console.error('❌ dist directory does not exist!');
  process.exit(1);
}

// Create verification files in all possible locations
const verificationLocations = [
  path.join(distDir, 'googlefaa9d441c86b843b.html'),
  path.join(distDir, 'pdfspark', 'googlefaa9d441c86b843b.html')
];

for (const verificationPath of verificationLocations) {
  try {
    // Ensure parent directory exists
    const parentDir = path.dirname(verificationPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    
    // Write verification file
    fs.writeFileSync(verificationPath, 'google-site-verification: googlefaa9d441c86b843b.html');
    console.log(`✅ Created Google verification file at: ${verificationPath}`);
  } catch (error) {
    console.error(`❌ Failed to create verification file at ${verificationPath}:`, error);
  }
}

// Check if meta tag exists in HTML files
const indexHtmlLocations = [
  path.join(distDir, 'index.html'),
  path.join(distDir, 'pdfspark', 'index.html')
];

for (const htmlPath of indexHtmlLocations) {
  if (fs.existsSync(htmlPath)) {
    try {
      let htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      if (!htmlContent.includes('google-site-verification')) {
        console.log(`Adding Google verification meta tag to: ${htmlPath}`);
        htmlContent = htmlContent.replace(
          /<meta name="viewport".*?>/,
          '$&\n    <meta name="google-site-verification" content="WIKscPK-LpMMM63OZiE66Gsg1K0LXmXSt5z6wP4AqwQ" />'
        );
        fs.writeFileSync(htmlPath, htmlContent);
        console.log(`✅ Added Google verification meta tag to: ${htmlPath}`);
      } else {
        console.log(`✅ Google verification meta tag already present in: ${htmlPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to update HTML file ${htmlPath}:`, error);
    }
  } else {
    console.log(`⚠️ HTML file not found: ${htmlPath}`);
  }
}

console.log('\n=====================================================================');
console.log('🔴 GOOGLE VERIFICATION SUMMARY:');
console.log('   - Verification files created in multiple locations');
console.log('   - Meta tags added to HTML files where missing');
console.log('   - To verify, check these URLs after deployment:');
console.log('     - https://www.quicksparks.dev/googlefaa9d441c86b843b.html');
console.log('     - https://www.quicksparks.dev/pdfspark/googlefaa9d441c86b843b.html');
console.log('=====================================================================\n');

console.log('✅ Post-build verification complete');