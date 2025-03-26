import { Builder, By, Key, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import path from 'path';
import { strict as assert } from 'assert';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Define test functions first
function noop() {}

// Make describe function async to allow waiting for before hooks
const describe = async (name, fn) => {
  console.log(`\n= ${name} =`);
  await fn();
};

const it = async (name, fn) => {
  console.log(`  - ${name}`);
  try {
    // Create a context object with timeout function
    const testContext = {
      timeout: noop
    };
    
    // If it's an async function, we need to await it
    if (fn.constructor.name === 'AsyncFunction') {
      await fn.call(testContext);
    } else {
      fn.call(testContext);
    }
    
    console.log(`    ✓ PASS: ${name}`);
  } catch (err) {
    console.log(`    ✗ FAIL: ${name}\n      ${err}`);
    throw err;
  }
};

// Make sure before function properly returns a Promise that can be awaited
const before = async (fn) => {
  console.log(`  Setup...`);
  try {
    if (fn.constructor.name === 'AsyncFunction') {
      await fn.call({timeout: noop});
    } else {
      fn.call({timeout: noop});
    }
    console.log(`  Setup completed successfully`);
  } catch (err) {
    console.error(`  Setup failed: ${err}`);
    throw err;
  }
};

// Make sure after function properly returns a Promise that can be awaited
const after = async (fn) => {
  console.log(`  Teardown...`);
  try {
    if (fn.constructor.name === 'AsyncFunction') {
      await fn.call({timeout: noop});
    } else {
      fn.call({timeout: noop});
    }
    console.log(`  Teardown completed successfully`);
  } catch (err) {
    console.error(`  Teardown failed: ${err}`);
    throw err;
  }
};

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const BASE_URL = 'http://localhost:3000/pdfspark/';
const TEST_TIMEOUT = 60000; // 60 seconds timeout for tests
const SAMPLE_PDF_PATH = path.resolve(__dirname, '../../public/sample-test.pdf');
const SAMPLE_DOCX_PATH = path.resolve(__dirname, '../../public/sample-test.docx');

// Create sample test files if they don't exist
if (!fs.existsSync(SAMPLE_PDF_PATH)) {
  // Create a simple PDF-like file for testing
  fs.writeFileSync(SAMPLE_PDF_PATH, '%PDF-1.5\nThis is a sample PDF file for testing.\n%%EOF');
  console.log(`Created test PDF file at ${SAMPLE_PDF_PATH}`);
}

if (!fs.existsSync(SAMPLE_DOCX_PATH)) {
  // Create a simple DOCX-like file for testing
  fs.writeFileSync(SAMPLE_DOCX_PATH, 'PK\u0003\u0004\u0014\u0000Sample DOCX file for testing.');
  console.log(`Created test DOCX file at ${SAMPLE_DOCX_PATH}`);
}

// Initialize a driver that's accessible to all tests
let driver;

// Test suite for conversion functionality
describe('PDFSpark Conversion Page Tests', function() {
  
  // Set up WebDriver before tests
  before(async function() {
    this.timeout(TEST_TIMEOUT);
    
    // Configure Chrome options
    const options = new chrome.Options();
    options.addArguments('--headless'); // Run in headless mode
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    
    // Build the driver
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    // Navigate to the application
    await driver.get(BASE_URL);
    console.log('WebDriver initialized and navigated to application');
  });
  
  // Clean up WebDriver after tests
  after(async function() {
    if (driver) {
      console.log('Closing WebDriver');
      await driver.quit();
    }
  });
  
  // Helper functions
  async function navigateToConversionPage() {
    try {
      // Safety check that driver is initialized
      if (!driver) {
        throw new Error('WebDriver not initialized. Make sure the before() hook has run.');
      }

      // Check if we're already on the conversion page
      const currentUrl = await driver.getCurrentUrl();
      if (!currentUrl.includes('conversion')) {
        // Find and click the conversion link or navigate directly
        await driver.get(`${BASE_URL}conversion`);
      }
      
      // Wait for the page to load
      await driver.wait(until.elementLocated(By.css('h1')), 10000);
      console.log('Navigated to conversion page');
      
      // We no longer use mock mode for testing - commented out for reference
      // await enableMockMode();
    } catch (error) {
      console.error('Error navigating to conversion page:', error);
      throw error;
    }
  }
  
  async function enableMockMode() {
    // We're no longer using mock mode - the real backend should be used
    console.log('Mock mode is disabled - using real backend');
    
    // Ensure mock mode is explicitly turned OFF
    try {
      if (!driver) {
        throw new Error('WebDriver not initialized. Make sure the before() hook has run.');
      }
      
      // Disable mock mode in localStorage if it was previously enabled
      await driver.executeScript(`
        if (window.localStorage) {
          window.localStorage.setItem('devMock', 'false');
          window.localStorage.removeItem('mockConversionStatus');
          console.log('DEV MOCK MODE DISABLED via JavaScript');
        }
      `);
    } catch (error) {
      console.error('Error disabling mock mode:', error);
      // Continue the test even if disabling mock mode fails
    }
  }
  
  async function uploadFile(filePath, conversionType) {
    try {
      // Safety check that driver is initialized
      if (!driver) {
        throw new Error('WebDriver not initialized. Make sure the before() hook has run.');
      }
      
      console.log(`Uploading file: ${filePath}`);
      
      // Select conversion type if specified
      if (conversionType) {
        const selectElement = await driver.findElement(By.id('conversion-type'));
        await selectElement.click();
        
        if (conversionType === 'pdf-to-docx') {
          await selectElement.findElement(By.xpath("//option[contains(text(), 'Convert PDF to Word')]")).click();
        } else if (conversionType === 'docx-to-pdf') {
          await selectElement.findElement(By.xpath("//option[contains(text(), 'Convert Word Document')]")).click();
        }
        
        console.log(`Selected conversion type: ${conversionType}`);
      }
      
      // Find the file input element
      // It might be hidden, so we need to make it visible first
      await driver.executeScript(`
        const fileInputs = document.querySelectorAll('input[type="file"]');
        for (let input of fileInputs) {
          input.style.opacity = '1';
          input.style.display = 'block';
          input.style.visibility = 'visible';
        }
      `);
      
      // Wait for file input to be visible and interactable
      const fileInput = await driver.wait(until.elementLocated(By.css('input[type="file"]')), 10000);
      
      // Send the file path to the input
      await fileInput.sendKeys(filePath);
      console.log('File path sent to input element');
      
      // Wait for file to be processed and shown in the UI
      await driver.wait(until.elementLocated(By.css('.mb-6 .bg-gray-50')), 10000);
      console.log('File upload confirmed - preview element found');
      
      return true;
    } catch (error) {
      console.error('Error uploading file:', error);
      return false;
    }
  }
  
  async function startConversion() {
    try {
      // Safety check that driver is initialized
      if (!driver) {
        throw new Error('WebDriver not initialized. Make sure the before() hook has run.');
      }

      console.log('Starting conversion process');
      
      // Find and click the Convert Now button
      const convertButton = await driver.findElement(
        By.xpath("//button[contains(text(), 'Convert Now')]")
      );
      await convertButton.click();
      console.log('Clicked Convert Now button');
      
      // Wait for the conversion process to start
      await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Processing') or contains(text(), 'Uploading')]")), 10000);
      console.log('Conversion process started');
      
      return true;
    } catch (error) {
      console.error('Error starting conversion:', error);
      return false;
    }
  }
  
  async function waitForConversionToComplete() {
    try {
      // Safety check that driver is initialized
      if (!driver) {
        throw new Error('WebDriver not initialized. Make sure the before() hook has run.');
      }

      console.log('Waiting for conversion to complete...');
      
      // Wait for the success message or download button
      await driver.wait(
        until.elementLocated(By.xpath("//*[contains(text(), 'Conversion Successful') or contains(text(), 'Download')]")), 
        30000
      );
      
      console.log('Conversion completed successfully');
      return true;
    } catch (error) {
      console.error('Error or timeout waiting for conversion to complete:', error);
      return false;
    }
  }
  
  async function removeFile() {
    try {
      // Safety check that driver is initialized
      if (!driver) {
        throw new Error('WebDriver not initialized. Make sure the before() hook has run.');
      }

      console.log('Removing file');
      
      // Find and click the Remove button
      const removeButton = await driver.findElement(
        By.xpath("//button[text()='Remove']")
      );
      await removeButton.click();
      
      // Wait for the upload area to reappear
      await driver.wait(until.elementLocated(By.css('input[type="file"]')), 10000);
      
      console.log('File removed successfully');
      return true;
    } catch (error) {
      console.error('Error removing file:', error);
      return false;
    }
  }
  
  // Tests
  it('should navigate to conversion page', async function() {
    this.timeout(TEST_TIMEOUT);
    await navigateToConversionPage();
    const title = await driver.findElement(By.css('h1')).getText();
    assert.ok(title.includes('Convert Your Document'), 'Page title should contain "Convert Your Document"');
  });
  
  it('should disable mock mode for real backend testing', async function() {
    this.timeout(TEST_TIMEOUT);
    await navigateToConversionPage();
    await enableMockMode(); // This function now disables mock mode
    
    // Verify mock mode is disabled by checking localStorage via JavaScript
    const isMockEnabled = await driver.executeScript(
      'return window.localStorage && window.localStorage.getItem("devMock") === "false"'
    );
    
    assert.strictEqual(isMockEnabled, true, 'Mock mode should be disabled for real backend testing');
  });
  
  it('should upload a PDF file', async function() {
    this.timeout(TEST_TIMEOUT);
    await navigateToConversionPage();
    
    const uploadSuccessful = await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
    assert.strictEqual(uploadSuccessful, true, 'Should successfully upload PDF file');
    
    // Verify the file preview is shown
    const previewText = await driver.findElement(By.css('.flex-1 h3')).getText();
    assert.ok(previewText.includes('sample-test.pdf'), 'File preview should show the uploaded file name');
  });
  
  it('should successfully convert PDF to DOCX with real backend', async function() {
    this.timeout(TEST_TIMEOUT);
    await navigateToConversionPage();
    
    // Upload PDF file
    await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
    
    // Start conversion
    await startConversion();
    
    // Wait for conversion to complete
    const conversionSuccessful = await waitForConversionToComplete();
    assert.strictEqual(conversionSuccessful, true, 'Conversion should complete successfully');
    
    // Verify download section is visible
    const downloadButton = await driver.findElements(By.xpath("//button[contains(text(), 'Download')]"));
    assert.ok(downloadButton.length > 0, 'Download button should be visible after successful conversion');
  });
  
  it('should successfully remove file', async function() {
    this.timeout(TEST_TIMEOUT);
    await navigateToConversionPage();
    
    // Upload file
    await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
    
    // Remove file
    const removalSuccessful = await removeFile();
    assert.strictEqual(removalSuccessful, true, 'Should successfully remove file');
    
    // Verify the file upload area is shown again
    const uploadArea = await driver.findElements(By.css('.bg-gray-50.rounded-xl'));
    assert.ok(uploadArea.length > 0, 'File upload area should be visible after file removal');
  });

  it('should successfully convert DOCX to PDF with real backend', async function() {
    this.timeout(TEST_TIMEOUT);
    await navigateToConversionPage();
    
    // Upload DOCX file
    await uploadFile(SAMPLE_DOCX_PATH, 'docx-to-pdf');
    
    // Start conversion
    await startConversion();
    
    // Wait for conversion to complete
    const conversionSuccessful = await waitForConversionToComplete();
    assert.strictEqual(conversionSuccessful, true, 'Conversion should complete successfully');
    
    // Verify download section is visible
    const downloadButton = await driver.findElements(By.xpath("//button[contains(text(), 'Download')]"));
    assert.ok(downloadButton.length > 0, 'Download button should be visible after successful conversion');
  });
});

// Run the tests directly when this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting Selenium tests for PDFSpark conversion functionality');
  
  // Main async function to run the tests
  (async () => {
    try {
      await describe('PDFSpark Conversion Page Tests', async function() {
        // Set up WebDriver before tests
        await before(async function() {
          this.timeout(TEST_TIMEOUT);
          
          // Configure Chrome options
          const options = new chrome.Options();
          options.addArguments('--headless'); // Run in headless mode
          options.addArguments('--no-sandbox');
          options.addArguments('--disable-dev-shm-usage');
          
          // Build the driver
          driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
          
          // Navigate to the application
          await driver.get(BASE_URL);
          console.log('WebDriver initialized and navigated to application');
        });
        
        // Clean up WebDriver after tests
        await after(async function() {
          if (driver) {
            console.log('Closing WebDriver');
            await driver.quit();
          }
        });
        
        // Tests
        await it('should navigate to conversion page', async function() {
          this.timeout(TEST_TIMEOUT);
          await navigateToConversionPage();
          const title = await driver.findElement(By.css('h1')).getText();
          assert.ok(title.includes('Convert Your Document'), 'Page title should contain "Convert Your Document"');
        });
        
        await it('should disable mock mode for real backend testing', async function() {
          this.timeout(TEST_TIMEOUT);
          await navigateToConversionPage();
          await enableMockMode(); // This function now disables mock mode
          
          // Verify mock mode is disabled by checking localStorage via JavaScript
          const isMockEnabled = await driver.executeScript(
            'return window.localStorage && window.localStorage.getItem("devMock") === "false"'
          );
          
          assert.strictEqual(isMockEnabled, true, 'Mock mode should be disabled for real backend testing');
        });
        
        await it('should upload a PDF file', async function() {
          this.timeout(TEST_TIMEOUT);
          await navigateToConversionPage();
          
          const uploadSuccessful = await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
          assert.strictEqual(uploadSuccessful, true, 'Should successfully upload PDF file');
          
          // Verify the file preview is shown
          const previewText = await driver.findElement(By.css('.flex-1 h3')).getText();
          assert.ok(previewText.includes('sample-test.pdf'), 'File preview should show the uploaded file name');
        });
        
        await it('should successfully convert PDF to DOCX with real backend', async function() {
          this.timeout(TEST_TIMEOUT);
          await navigateToConversionPage();
          
          // Upload PDF file
          await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
          
          // Start conversion
          await startConversion();
          
          // Wait for conversion to complete
          const conversionSuccessful = await waitForConversionToComplete();
          assert.strictEqual(conversionSuccessful, true, 'Conversion should complete successfully');
          
          // Verify download section is visible
          const downloadButton = await driver.findElements(By.xpath("//button[contains(text(), 'Download')]"));
          assert.ok(downloadButton.length > 0, 'Download button should be visible after successful conversion');
        });
        
        await it('should successfully remove file', async function() {
          this.timeout(TEST_TIMEOUT);
          await navigateToConversionPage();
          
          // Upload file
          await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
          
          // Remove file
          const removalSuccessful = await removeFile();
          assert.strictEqual(removalSuccessful, true, 'Should successfully remove file');
          
          // Verify the file upload area is shown again
          const uploadArea = await driver.findElements(By.css('.bg-gray-50.rounded-xl'));
          assert.ok(uploadArea.length > 0, 'File upload area should be visible after file removal');
        });
        
        await it('should successfully convert DOCX to PDF with real backend', async function() {
          this.timeout(TEST_TIMEOUT);
          await navigateToConversionPage();
          
          // Upload DOCX file
          await uploadFile(SAMPLE_DOCX_PATH, 'docx-to-pdf');
          
          // Start conversion
          await startConversion();
          
          // Wait for conversion to complete
          const conversionSuccessful = await waitForConversionToComplete();
          assert.strictEqual(conversionSuccessful, true, 'Conversion should complete successfully');
          
          // Verify download section is visible
          const downloadButton = await driver.findElements(By.xpath("//button[contains(text(), 'Download')]"));
          assert.ok(downloadButton.length > 0, 'Download button should be visible after successful conversion');
        });
      });
    } catch (err) {
      console.error('Test execution failed:', err);
      process.exit(1);
    }
  })();
}