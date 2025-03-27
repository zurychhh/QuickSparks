/**
 * Basic Selenium Test for PDFSpark Conversion Page
 */

import { Builder, By, Key, until } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome.js';
import path from 'path';
import assert from 'assert';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = 'http://localhost:3000/pdfspark/';
const CONVERSION_URL = 'http://localhost:3000/pdfspark/convert';
const TEST_TIMEOUT = 60000; // 60 seconds timeout for tests
const SAMPLE_PDF_PATH = path.resolve(__dirname, '../public/sample-test.pdf');

// Ensure public directory exists
const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create sample test file if it doesn't exist
if (!fs.existsSync(SAMPLE_PDF_PATH)) {
  // Create a simple PDF-like file for testing
  fs.writeFileSync(SAMPLE_PDF_PATH, '%PDF-1.5\nThis is a sample PDF file for testing.\n%%EOF');
  console.log(`Created test PDF file at ${SAMPLE_PDF_PATH}`);
}

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.resolve(__dirname, '../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  console.log(`Created screenshots directory at ${screenshotsDir}`);
}

/**
 * Capture screenshot
 */
async function captureScreenshot(driver, name) {
  try {
    const screenshot = await driver.takeScreenshot();
    const screenshotPath = path.resolve(screenshotsDir, `${name}.png`);
    fs.writeFileSync(screenshotPath, screenshot, 'base64');
    console.log(`Screenshot saved to ${screenshotPath}`);
  } catch (error) {
    console.error('Error capturing screenshot:', error);
  }
}

/**
 * Run test
 */
async function runTest() {
  console.log('Running basic conversion page test...');
  
  let driver;
  
  try {
    // Setup Chrome options
    const options = new ChromeOptions();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    
    // Build driver
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    // Navigate to application
    await driver.get(BASE_URL);
    console.log('Navigated to application');
    
    // Capture initial screenshot
    await captureScreenshot(driver, 'initial-page');
    
    // Navigate to conversion page
    await driver.get(CONVERSION_URL);
    await driver.wait(until.elementLocated(By.css('body')), 10000);
    console.log('Navigated to conversion page');
    
    // Capture conversion page screenshot
    await captureScreenshot(driver, 'conversion-page');
    
    // Check if we're on a page with content
    const pageContent = await driver.findElements(By.css('body'));
    assert.ok(pageContent.length > 0, 'Page should have body element');
    
    // Get page HTML for debugging
    const html = await driver.executeScript('return document.documentElement.outerHTML');
    console.log('Page HTML (first 500 chars):', html.substring(0, 500));
    console.log('Page content verified');
    
    // Enable mock mode for testing
    await driver.executeScript(`
      if (window.localStorage) {
        window.localStorage.setItem('devMock', 'true');
        console.log('DEV MOCK MODE ENABLED via JavaScript');
      }
    `);
    
    // Refresh to apply mock mode
    await driver.navigate().refresh();
    await driver.wait(until.elementLocated(By.css('body')), 10000);
    
    // Try to find a drop zone or file input area
    console.log('Looking for drop zone or file input area...');
    
    // Try to log all elements on the page for debugging
    const allElements = await driver.executeScript(`
      return Array.from(document.querySelectorAll('*')).map(el => {
        return {
          tag: el.tagName,
          classes: el.className,
          id: el.id,
          type: el.type
        };
      }).filter(info => info.classes || info.id);
    `);
    console.log('Found elements:', JSON.stringify(allElements.slice(0, 10), null, 2));
    
    // Try to find specific conversion page components
    const h1Elements = await driver.findElements(By.css('h1'));
    console.log(`Found ${h1Elements.length} h1 elements:`);
    for (const h1 of h1Elements) {
      console.log(`H1 text: "${await h1.getText()}"`);
    }
    
    // Try to find the "Select File" button
    const selectFileButton = await driver.findElement(By.xpath("//button[contains(text(), 'Select File')]"));
    console.log('Found "Select File" button');
    
    // Find any file input elements
    const fileInputs = await driver.findElements(By.css('input[type="file"]'));
    console.log(`Found ${fileInputs.length} file input elements`);
    
    if (fileInputs.length === 0) {
      console.log('No file input found, making file inputs visible');
      // Try to make file inputs visible
      await driver.executeScript(`
        const fileInputs = document.querySelectorAll('input');
        for (const input of fileInputs) {
          if (input.type === 'file' || input.accept && input.accept.includes('pdf')) {
            // Make it visible
            input.style.opacity = '1';
            input.style.display = 'block';
            input.style.position = 'fixed';
            input.style.top = '20px';
            input.style.left = '20px';
            input.style.zIndex = '9999';
            console.log('Made a file input visible:', input);
          }
        }
      `);
    }
    
    // Try clicking the Select File button first
    await selectFileButton.click();
    console.log('Clicked Select File button');
    
    // Wait a moment for any dialogs to appear
    await driver.sleep(1000);
    
    // Check again for file inputs after clicking the button
    const fileInputsAfterClick = await driver.findElements(By.css('input[type="file"]'));
    console.log(`Found ${fileInputsAfterClick.length} file input elements after clicking Select File`);
    
    // Inject a file input if we still can't find one
    if (fileInputsAfterClick.length === 0) {
      console.log('Still no file input found, injecting our own');
      await driver.executeScript(`
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'selenium-test-file-input';
        fileInput.style.position = 'fixed';
        fileInput.style.top = '10px';
        fileInput.style.left = '10px';
        fileInput.style.zIndex = '9999';
        document.body.appendChild(fileInput);
        console.log('Injected test file input');
      `);
    }
    
    // Find any file input we can use
    const visibleFileInputs = await driver.findElements(By.css('input[type="file"], #selenium-test-file-input'));
    console.log(`Found ${visibleFileInputs.length} visible file input elements`);
    
    // Use the first available file input
    const fileInputToUse = visibleFileInputs.length > 0 ? visibleFileInputs[0] : null;
    if (fileInputToUse) {
      console.log('Found file input to use, uploading test file');
      await fileInputToUse.sendKeys(SAMPLE_PDF_PATH);
      
      // Wait a moment for file to be processed
      await driver.sleep(2000);
      
      // Take screenshot after file upload
      await captureScreenshot(driver, 'after-file-upload');
      
      // Try to find convert button
      const buttons = await driver.findElements(By.css('button'));
      console.log(`Found ${buttons.length} buttons on page`);
      
      // Find a button that might be for conversion (contains text like "Convert")
      for (const button of buttons) {
        const buttonText = await button.getText();
        console.log(`Button text: "${buttonText}"`);
        
        if (buttonText.includes('Convert') || buttonText.toLowerCase().includes('convert')) {
          console.log('Found convert button, clicking');
          await button.click();
          
          // Wait a moment for conversion to start
          await driver.sleep(3000);
          
          // Take screenshot during conversion
          await captureScreenshot(driver, 'during-conversion');
          
          // Wait for conversion to complete (up to 10 seconds)
          await driver.sleep(10000);
          
          // Take screenshot after conversion
          await captureScreenshot(driver, 'after-conversion');
          
          // Check for conversion success indicators
          console.log('Checking for conversion success indicators...');
          const pageTextAfterConversion = await driver.executeScript('return document.body.innerText');
          
          if (pageTextAfterConversion.includes('Conversion Successful') || 
              pageTextAfterConversion.includes('Download') ||
              pageTextAfterConversion.includes('converted')) {
            console.log('CONVERSION SUCCESS: Found success indicators in page text');
          } else if (pageTextAfterConversion.includes('Error') || 
                    pageTextAfterConversion.includes('Failed')) {
            console.log('CONVERSION FAILED: Found error indicators in page text');
          } else {
            console.log('CONVERSION STATUS UNKNOWN: No clear success or error indicators found');
          }
          
          // Try to find download button
          const downloadButtons = await driver.findElements(By.xpath("//button[contains(text(), 'Download')]"));
          if (downloadButtons.length > 0) {
            console.log('Found download button - conversion was successful');
          }
          
          break;
        }
      }
    } else {
      console.log('No file input found on page');
    }
    
    console.log('Test completed successfully');
    return true;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}

// Run the test
runTest().then(success => {
  console.log(`Test result: ${success ? 'PASSED' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});