const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function captureScreenshots() {
  const screenshotsDir = path.join(__dirname, 'visual-test-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Capture different viewport sizes
  const viewports = [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 812, name: 'mobile' }
  ];
  
  // URLs to test
  const urls = [
    'http://localhost:3000/pdfspark',
    'http://localhost:3000/pdfspark/convert',
    'http://localhost:3000/pdfspark/product',
    'http://localhost:3000/pdfspark/pricing'
  ];
  
  // Start the server
  require('child_process').execSync('cd /Users/user/conversion-microservices/packages/frontend && npm run dev &');
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    for (const url of urls) {
      for (const viewport of viewports) {
        console.log(`Capturing ${url} at ${viewport.name} size`);
        
        await page.setViewport({ width: viewport.width, height: viewport.height });
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        const fileName = `${url.replace(/https?:\/\/|\/|\./g, '_')}_${viewport.name}.png`;
        await page.screenshot({ path: path.join(screenshotsDir, fileName) });
      }
    }
    
    console.log('Visual testing complete!');
  } catch (error) {
    console.error('Error during visual testing:', error);
  } finally {
    // Stop the server
    require('child_process').execSync('pkill -f "npm run dev"');
    
    await browser.close();
  }
}

captureScreenshots().catch(console.error);
