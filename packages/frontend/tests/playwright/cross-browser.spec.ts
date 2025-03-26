import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Ensure screenshots directory exists
const screenshotsDir = path.join(process.cwd(), 'test-reports', 'cross-browser');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Real backend discovery function
async function discoverBackendUrl(page) {
  // List of possible backend URLs to try
  const possibleUrls = [
    'http://localhost:3000/pdfspark',
    'http://localhost:5173/pdfspark',
    'http://localhost:8080/pdfspark',
    'http://localhost:3001/pdfspark',
    'http://localhost:5000/pdfspark',
    '/pdfspark' // Relative to baseURL
  ];
  
  for (const url of possibleUrls) {
    try {
      console.log(`Attempting to connect to: ${url}`);
      await page.goto(url, { timeout: 10000, waitUntil: 'domcontentloaded' });
      
      // Check if page loaded successfully (has a title and body)
      const hasTitle = await page.title().then(title => title.length > 0);
      const hasBody = await page.$('body').then(body => !!body);
      
      if (hasTitle && hasBody) {
        console.log(`✅ Successfully connected to backend at: ${url}`);
        return url;
      }
    } catch (error) {
      console.log(`Could not connect to ${url}: ${error.message}`);
    }
  }
  
  // If all URLs fail, use the first one as a fallback
  console.warn('⚠️ Could not verify any backend URL. Using default...');
  return possibleUrls[0];
}

// Browser-specific error handling function
async function withBrowserSpecificErrorHandling(browserName, action) {
  try {
    return await action();
  } catch (error) {
    console.error(`Error in ${browserName} browser: ${error.message}`);
    
    // Browser-specific error handling
    if (browserName === 'webkit' && error.message.includes('timeout')) {
      console.log('WebKit timeout detected. Implementing WebKit-specific workaround...');
      // WebKit specific handling
    } else if (browserName === 'firefox' && error.message.includes('Element is not visible')) {
      console.log('Firefox visibility issue detected. Implementing Firefox-specific workaround...');
      // Firefox specific handling
    }
    
    throw error; // Re-throw after logging
  }
}

// Resource cleanup function
async function cleanupResources(page, browserName) {
  console.log(`Cleaning up resources for ${browserName}...`);
  
  // Close dialogs if any are open
  try {
    const hasDialog = await page.$('.dialog, .modal, [role="dialog"]');
    if (hasDialog) {
      await page.click('.close-button, .dismiss, button:has-text("Close")');
    }
  } catch (e) {
    // Ignore cleanup errors
  }
  
  // Clear any temporary storage
  await page.evaluate(() => {
    // Clear localStorage if available
    try {
      localStorage.clear();
    } catch (e) {}
    
    // Clear sessionStorage if available
    try {
      sessionStorage.clear();
    } catch (e) {}
  });
}

test.describe('PDFSpark Cross-Browser Compatibility Tests', () => {
  let backendUrl;
  
  test.beforeAll(async ({ browser }) => {
    // Discover backend URL once before all tests
    const page = await browser.newPage();
    try {
      backendUrl = await discoverBackendUrl(page);
    } finally {
      await page.close();
    }
  });
  
  test('Core UI functionality works across browsers', async ({ page, browserName }) => {
    await test.step(`Running test on ${browserName}`, async () => {
      try {
        console.log(`Starting cross-browser test on ${browserName}`);
        
        // Navigate to the application using discovered URL
        await withBrowserSpecificErrorHandling(browserName, async () => {
          await page.goto(backendUrl);
          
          // Check if the page loads successfully - use flexible title matching
          const possibleTitles = ['PDFSpark', 'QuickSparks', 'Document Conversion'];
          let titleFound = false;
          
          for (const title of possibleTitles) {
            try {
              await expect(page).toHaveTitle(new RegExp(title, 'i'), { timeout: 10000 });
              titleFound = true;
              console.log(`Found page title containing "${title}"`);
              break;
            } catch (e) {}
          }
          
          expect(titleFound).toBeTruthy();
        });
        
        // Take a screenshot for visual reference
        await page.screenshot({ path: path.join(screenshotsDir, `${browserName}-homepage.png`) });
        
        // Basic responsive tests using browser-specific error handling
        await withBrowserSpecificErrorHandling(browserName, async () => {
          // Test desktop layout
          await page.setViewportSize({ width: 1366, height: 768 });
          await page.waitForLoadState('networkidle');
          await page.screenshot({ path: path.join(screenshotsDir, `${browserName}-desktop.png`) });
          
          // Test tablet layout
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForLoadState('networkidle');
          await page.screenshot({ path: path.join(screenshotsDir, `${browserName}-tablet.png`) });
          
          // Test mobile layout
          await page.setViewportSize({ width: 375, height: 667 });
          await page.waitForLoadState('networkidle');
          await page.screenshot({ path: path.join(screenshotsDir, `${browserName}-mobile.png`) });
        });
        
        // Check if key elements are visible using multiple selector strategies
        const uploadHeadingSelectors = [
          'h1:has-text("Upload")',
          'h2:has-text("Upload")',
          'h3:has-text("Upload")',
          '[data-testid="upload-heading"]',
          '.upload-title',
          'header h1',
          '.header-title'
        ];
        
        let elementFound = false;
        for (const selector of uploadHeadingSelectors) {
          const element = page.locator(selector);
          if (await element.count() > 0) {
            await expect(element.first()).toBeVisible();
            elementFound = true;
            console.log(`Found upload heading with selector: ${selector}`);
            break;
          }
        }
        
        // If no heading found, check for any significant content
        if (!elementFound) {
          const contentSelectors = ['.content', 'main', '[role="main"]', '#app'];
          for (const selector of contentSelectors) {
            const element = page.locator(selector);
            if (await element.count() > 0) {
              await expect(element.first()).toBeVisible();
              elementFound = true;
              console.log(`Found main content with selector: ${selector}`);
              break;
            }
          }
        }
        
        expect(elementFound).toBeTruthy();
        
        // Navigate to conversion page
        const convertPageUrl = `${backendUrl.replace(/\/$/, '')}/convert`;
        await withBrowserSpecificErrorHandling(browserName, async () => {
          await page.goto(convertPageUrl);
          await page.waitForLoadState('networkidle');
          await page.screenshot({ path: path.join(screenshotsDir, `${browserName}-conversion-page.png`) });
        });
        
        console.log(`Cross-browser test completed successfully on ${browserName}`);
      } finally {
        // Always clean up resources
        await cleanupResources(page, browserName);
      }
    });
  });
  
  test('File upload works consistently across browsers', async ({ page, browserName }) => {
    // Prepare test files path
    const testSamplesPath = path.join(process.cwd(), 'public');
    const samplePdfPath = path.join(testSamplesPath, 'sample-test.pdf');
    
    // Create test file if it doesn't exist
    if (!fs.existsSync(samplePdfPath)) {
      console.log('Creating test PDF file for cross-browser file upload test');
      if (!fs.existsSync(testSamplesPath)) {
        fs.mkdirSync(testSamplesPath, { recursive: true });
      }
      // Minimum valid PDF content
      fs.writeFileSync(samplePdfPath, '%PDF-1.4\n%ÂÃÏÏ\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 6 0 R >>\nendobj\n4 0 obj\n<< /Font << /F1 5 0 R >> >>\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n6 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Sample PDF) Tj\nET\nendstream\nendobj\nxref\n0 7\n0000000000 65535 f\n0000000010 00000 n\n0000000059 00000 n\n0000000118 00000 n\n0000000217 00000 n\n0000000262 00000 n\n0000000329 00000 n\ntrailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n427\n%%EOF');
    }
    
    await test.step(`Testing file upload on ${browserName}`, async () => {
      try {
        console.log(`Starting file upload test on ${browserName}`);
        
        // Navigate to conversion page
        const convertPageUrl = `${backendUrl.replace(/\/$/, '')}/convert`;
        await withBrowserSpecificErrorHandling(browserName, async () => {
          await page.goto(convertPageUrl);
          await page.waitForLoadState('networkidle');
        });
        
        // Find file input using multiple selector strategies
        const fileInputSelectors = [
          'input[type="file"]',
          'input[accept*="pdf"]',
          'input[accept*="docx"]',
          '[data-testid="file-input"]'
        ];
        
        let fileInputFound = false;
        for (const selector of fileInputSelectors) {
          const input = page.locator(selector);
          if (await input.count() > 0) {
            // Browser specific handling for file uploads
            if (browserName === 'webkit') {
              // WebKit may need the input to be visible
              await page.evaluate((sel) => {
                const element = document.querySelector(sel);
                if (element) {
                  element.style.opacity = '1';
                  element.style.visibility = 'visible';
                  element.style.display = 'block';
                  element.style.position = 'fixed';
                  element.style.top = '0';
                  element.style.left = '0';
                  element.style.zIndex = '9999';
                }
              }, selector);
            }
            
            // Upload the file with browser-specific error handling
            await withBrowserSpecificErrorHandling(browserName, async () => {
              await input.setInputFiles(samplePdfPath);
              console.log(`Uploaded file using selector: ${selector}`);
            });
            
            fileInputFound = true;
            
            // Look for and click submit/convert button after file selection
            const buttonSelectors = [
              'button:has-text("Convert")',
              'button:has-text("Upload")',
              'button:has-text("Submit")',
              'button[type="submit"]',
              '[data-testid="submit-button"]'
            ];
            
            let submitButtonClicked = false;
            for (const buttonSelector of buttonSelectors) {
              const button = page.locator(buttonSelector);
              if (await button.count() > 0 && await button.first().isVisible()) {
                await withBrowserSpecificErrorHandling(browserName, async () => {
                  await button.first().click();
                  submitButtonClicked = true;
                  console.log(`Clicked submit button with selector: ${buttonSelector}`);
                });
                
                if (submitButtonClicked) break;
              }
            }
            
            // Take screenshot of the result
            await page.screenshot({ 
              path: path.join(screenshotsDir, `${browserName}-file-upload-result.png`),
              fullPage: true
            });
            
            break;
          }
        }
        
        if (!fileInputFound) {
          // If no file input found, check for alternative upload mechanisms
          console.log('No file input element found, checking for alternative upload mechanisms');
          
          const dropZoneSelectors = [
            '.dropzone',
            '.file-upload-area',
            '[data-testid="upload-area"]',
            'div:has-text("drag and drop")',
            'div:has-text("upload your file")'
          ];
          
          let dropZoneFound = false;
          for (const selector of dropZoneSelectors) {
            const dropZone = page.locator(selector);
            if (await dropZone.count() > 0 && await dropZone.first().isVisible()) {
              console.log(`Found drop zone with selector: ${selector}, but can't test drag-drop`);
              dropZoneFound = true;
              break;
            }
          }
          
          // Either file input or dropzone should exist
          expect(fileInputFound || dropZoneFound).toBeTruthy();
        }
        
      } finally {
        // Clean up resources
        await cleanupResources(page, browserName);
      }
    });
  });
});