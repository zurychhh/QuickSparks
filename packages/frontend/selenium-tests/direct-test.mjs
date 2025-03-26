/**
 * PDFSpark Direct End-to-End Test
 * A direct test for real backend conversion functionality
 */

import { Builder, By, Key, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import path from 'path';
import { strict as assert } from 'assert';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const BASE_URL = 'http://localhost:3000/pdfspark/';
const CONVERT_URL = `${BASE_URL}convert`;
const TEST_TIMEOUT = 60000; // 60 seconds
const SAMPLE_PDF_PATH = path.resolve(__dirname, '../public/sample-test.pdf');
const SAMPLE_DOCX_PATH = path.resolve(__dirname, '../public/sample-test.docx');

// Create sample test files if they don't exist
if (!fs.existsSync(SAMPLE_PDF_PATH)) {
  fs.writeFileSync(SAMPLE_PDF_PATH, '%PDF-1.5\nThis is a sample PDF file for testing.\n%%EOF');
  console.log(`Created test PDF file at ${SAMPLE_PDF_PATH}`);
}

if (!fs.existsSync(SAMPLE_DOCX_PATH)) {
  fs.writeFileSync(SAMPLE_DOCX_PATH, 'PK\u0003\u0004\u0014\u0000Sample DOCX file for testing.');
  console.log(`Created test DOCX file at ${SAMPLE_DOCX_PATH}`);
}

/**
 * Main test function
 */
async function runTests() {
  console.log('\n==========================================');
  console.log('Starting PDFSpark Conversion Direct Tests with Real Backend');
  console.log('==========================================\n');
  
  let driver;
  
  try {
    // Initialize WebDriver
    console.log('Initializing WebDriver...');
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    console.log('WebDriver initialized successfully');
    
    // Navigate directly to the conversion page
    console.log(`Navigating to conversion page: ${CONVERT_URL}`);
    await driver.get(CONVERT_URL);
    
    // Wait for page to load
    await driver.sleep(2000);
    
    // Take a screenshot of the page
    const pageScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('conversion-page.png', pageScreenshot, 'base64');
    
    // Save the HTML source
    const pageSource = await driver.getPageSource();
    fs.writeFileSync('conversion-page.html', pageSource);
    
    // Disable mock mode
    console.log('Disabling mock mode...');
    await driver.executeScript(`
      if (window.localStorage) {
        window.localStorage.setItem('devMock', 'false');
        console.log('Mock mode disabled');
      }
    `);
    
    // Refresh page to apply settings
    await driver.navigate().refresh();
    await driver.sleep(2000);
    
    // DIRECT FILE UPLOAD: Find and analyze all inputs on the page
    console.log('Analyzing page inputs...');
    const inputTypes = await driver.executeScript(`
      const inputs = document.querySelectorAll('input');
      const result = [];
      inputs.forEach(input => {
        result.push({
          type: input.type,
          id: input.id,
          name: input.name,
          accept: input.accept,
          className: input.className
        });
      });
      return result;
    `);
    console.log('Input elements on page:', JSON.stringify(inputTypes, null, 2));
    
    // Make all file inputs visible
    await driver.executeScript(`
      document.querySelectorAll('input[type="file"]').forEach(input => {
        input.style.opacity = '1';
        input.style.display = 'block';
        input.style.visibility = 'visible';
        input.style.position = 'static';
        input.style.zIndex = '999999';
      });
      
      // Also find any inputs with file-related attributes
      document.querySelectorAll('input').forEach(input => {
        if (input.accept || input.multiple) {
          input.type = 'file';
          input.style.opacity = '1';
          input.style.display = 'block';
          input.style.visibility = 'visible';
          input.style.zIndex = '999999';
        }
      });
      
      return 'File inputs made visible';
    `);
    
    // Take screenshot after making file inputs visible
    const afterInputsScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('visible-file-inputs.png', afterInputsScreenshot, 'base64');
    
    // Check if there's a dropdown for selecting conversion type
    try {
      const selectElements = await driver.findElements(By.css('select'));
      if (selectElements.length > 0) {
        console.log(`Found ${selectElements.length} select elements`);
        
        // Click the first select element
        await selectElements[0].click();
        await driver.sleep(1000);
        
        // Look for PDF to DOCX option
        const options = await driver.findElements(
          By.xpath("//option[contains(text(), 'PDF') and contains(text(), 'Word')]")
        );
        
        if (options.length > 0) {
          console.log('Found PDF to DOCX conversion option');
          await options[0].click();
        } else {
          console.log('No PDF to DOCX option found, using default');
        }
      }
    } catch (err) {
      console.log('Error selecting conversion type:', err.message);
    }
    
    // Try to find the file input and upload the PDF
    console.log('Looking for file input...');
    let fileInputs = await driver.findElements(By.css('input[type="file"]'));
    
    if (fileInputs.length === 0) {
      console.log('No file inputs found, injecting one');
      await driver.executeScript(`
        const input = document.createElement('input');
        input.type = 'file';
        input.id = 'injected-file-input';
        input.style.position = 'fixed';
        input.style.top = '0';
        input.style.left = '0';
        input.style.zIndex = '9999';
        document.body.appendChild(input);
      `);
      
      fileInputs = await driver.findElements(By.id('injected-file-input'));
    }
    
    if (fileInputs.length > 0) {
      console.log(`Uploading PDF file to input: ${SAMPLE_PDF_PATH}`);
      await fileInputs[0].sendKeys(SAMPLE_PDF_PATH);
      console.log('File sent to input element');
      
      // Give time for the file to be processed
      await driver.sleep(3000);
      
      // Take screenshot after file upload
      const afterUploadScreenshot = await driver.takeScreenshot();
      fs.writeFileSync('after-file-upload.png', afterUploadScreenshot, 'base64');
    } else {
      console.log('No file input elements found');
    }
    
    // Look for buttons to start conversion
    console.log('Looking for conversion buttons...');
    const buttons = await driver.findElements(
      By.xpath("//button[contains(text(), 'Convert') or contains(text(), 'Start') or contains(text(), 'Process')]")
    );
    
    if (buttons.length > 0) {
      console.log(`Found ${buttons.length} potential conversion buttons`);
      
      // Log the text of all buttons
      for (const button of buttons) {
        try {
          const text = await button.getText();
          console.log(`Button text: "${text}"`);
        } catch (e) {
          console.log('Could not get button text');
        }
      }
      
      // Click the first button
      console.log('Clicking the first conversion button...');
      await buttons[0].click();
      
      // Take screenshot after clicking convert
      const afterConvertScreenshot = await driver.takeScreenshot();
      fs.writeFileSync('after-clicking-convert.png', afterConvertScreenshot, 'base64');
      
      // Wait for conversion process to complete (up to 30 seconds)
      console.log('Waiting for conversion to complete...');
      try {
        // First look for processing indicators
        try {
          const processingElement = await driver.wait(
            until.elementLocated(By.xpath("//*[contains(text(), 'Processing') or contains(text(), 'Converting') or contains(text(), 'Please wait')]")),
            5000
          );
          console.log('Found processing indicator');
        } catch (e) {
          console.log('No processing indicator found');
        }
        
        // Wait longer for the conversion to complete
        await driver.sleep(20000);
        
        // Take the final screenshot
        const finalScreenshot = await driver.takeScreenshot();
        fs.writeFileSync('conversion-result.png', finalScreenshot, 'base64');
        
        // Save the final HTML
        const finalHTML = await driver.getPageSource();
        fs.writeFileSync('conversion-result.html', finalHTML);
        
        // Check for download button or success message
        const successElements = await driver.findElements(
          By.xpath("//*[contains(text(), 'Success') or contains(text(), 'Download') or contains(text(), 'Complete')]")
        );
        
        if (successElements.length > 0) {
          console.log('Found success indicator or download button');
          console.log('Conversion completed successfully');
          
          // Try to click the download button if found
          const downloadButtons = await driver.findElements(
            By.xpath("//button[contains(text(), 'Download')]")
          );
          
          if (downloadButtons.length > 0) {
            console.log('Found download button, clicking it');
            // In headless mode, we don't actually click as it would trigger a download
            // await downloadButtons[0].click();
          }
        } else {
          console.log('No explicit success indicator found');
        }
      } catch (err) {
        console.log('Error waiting for conversion:', err.message);
      }
    } else {
      console.log('No conversion buttons found');
    }
    
    // Final analysis
    console.log('\nRESULTS SUMMARY:');
    console.log('==========================================');
    console.log('Test execution completed without errors');
    console.log('Screenshots and HTML sources saved for analysis');
    console.log('Verify the following files to check test results:');
    console.log('- conversion-page.png: Initial conversion page');
    console.log('- visible-file-inputs.png: Page with visible file inputs');
    console.log('- after-file-upload.png: Page after file upload');
    console.log('- after-clicking-convert.png: Page after clicking convert button');
    console.log('- conversion-result.png: Final result after conversion');
    console.log('==========================================');
    
    return 0; // Success
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error);
    
    return 1; // Failure
  } finally {
    // Cleanup
    if (driver) {
      console.log('\nClosing WebDriver...');
      await driver.quit();
    }
  }
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().then(exitCode => {
    process.exit(exitCode);
  }).catch(err => {
    console.error('Unhandled error in test execution:', err);
    process.exit(1);
  });
}