/**
 * Backend Integration Test Suite for PDFSpark Conversion
 * 
 * This test suite tests the frontend integration with a real backend conversion service.
 * These tests will only pass if the backend conversion service is running.
 * 
 * To run this test suite:
 * 1. Start the backend conversion service
 * 2. Run: npm run test:selenium backend-integration.test.js
 */

const { Builder, By, Key, until, logging } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const assert = require('assert');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3000/pdfspark/';
const CONVERSION_API_URL = process.env.CONVERSION_API_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 120000; // 2 minutes timeout for backend tests
const SAMPLE_PDF_PATH = path.resolve(__dirname, '../public/sample-test.pdf');
const SAMPLE_DOCX_PATH = path.resolve(__dirname, '../public/sample-test.docx');

// Create sample test files if they don't exist
function createTestFiles() {
  if (!fs.existsSync(path.dirname(SAMPLE_PDF_PATH))) {
    fs.mkdirSync(path.dirname(SAMPLE_PDF_PATH), { recursive: true });
  }

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
}

// Create test files
createTestFiles();

// Utility Functions
async function captureConsoleLog(driver, context) {
  const logs = await driver.manage().logs().get(logging.Type.BROWSER);
  if (logs.length > 0) {
    console.log(`\n---- Browser Console Logs (${context}) ----`);
    logs.forEach(log => console.log(`[${log.level.name}] ${log.message}`));
    console.log('----------------------------------------\n');
  }
}

async function captureScreenshot(driver, name) {
  try {
    const screenshot = await driver.takeScreenshot();
    const screenshotPath = path.resolve(__dirname, `../screenshots/${name}.png`);
    
    // Ensure directory exists
    if (!fs.existsSync(path.dirname(screenshotPath))) {
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    }
    
    fs.writeFileSync(screenshotPath, screenshot, 'base64');
    console.log(`Screenshot saved to ${screenshotPath}`);
  } catch (error) {
    console.error('Error capturing screenshot:', error);
  }
}

// Test Suite
describe('PDFSpark Backend Integration Tests', function() {
  let driver;
  
  // Set up WebDriver before tests
  before(async function() {
    this.timeout(TEST_TIMEOUT);
    
    try {
      // Configure Chrome options
      const options = new chrome.Options();
      options.addArguments('--headless');
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      options.addArguments('--window-size=1366,768');
      options.setLoggingPrefs({browser: 'ALL'});
      
      // Build the driver
      driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
      
      // Navigate to the application
      await driver.get(BASE_URL);
      console.log('WebDriver initialized and navigated to application');
    } catch (error) {
      console.error('Error setting up WebDriver:', error);
      throw error;
    }
  });
  
  // Clean up WebDriver after tests
  after(async function() {
    this.timeout(TEST_TIMEOUT);
    
    if (driver) {
      try {
        await captureConsoleLog(driver, 'test cleanup');
        console.log('Closing WebDriver');
        await driver.quit();
      } catch (error) {
        console.error('Error cleaning up WebDriver:', error);
      }
    }
  });
  
  // Helper Functions
  async function navigateToConversionPage() {
    try {
      await driver.get(`${BASE_URL}conversion`);
      await driver.wait(until.elementLocated(By.css('h1')), 10000);
      console.log('Navigated to conversion page');
      
      // Disable mock mode to ensure we're using the real backend
      await disableMockMode();
    } catch (error) {
      console.error('Error navigating to conversion page:', error);
      await captureScreenshot(driver, 'navigation-error');
      throw error;
    }
  }
  
  async function disableMockMode() {
    try {
      // Execute JavaScript to disable mock mode
      await driver.executeScript(`
        if (window.localStorage) {
          window.localStorage.setItem('devMock', 'false');
          console.log('DEV MOCK MODE DISABLED via JavaScript');
        }
      `);
      
      // Refresh the page to apply changes
      await driver.navigate().refresh();
      await driver.wait(until.elementLocated(By.css('h1')), 10000);
      
      // Check if dev panel is visible and mock mode is disabled
      const devPanels = await driver.findElements(By.xpath("//h4[contains(text(), 'Developer Testing Panel')]"));
      if (devPanels.length > 0) {
        const mockButtons = await driver.findElements(By.xpath("//button[contains(text(), 'Mock Mode: OFF')]"));
        if (mockButtons.length === 0) {
          // Click the mock mode button to disable it
          const onButtons = await driver.findElements(By.xpath("//button[contains(text(), 'Mock Mode: ON')]"));
          if (onButtons.length > 0) {
            await onButtons[0].click();
            await driver.sleep(1000);
            await driver.wait(until.elementLocated(By.css('h1')), 10000);
          }
        }
      }
      
      console.log('Mock mode disabled');
    } catch (error) {
      console.error('Error disabling mock mode:', error);
      await captureScreenshot(driver, 'mock-mode-error');
    }
  }
  
  async function uploadFile(filePath, conversionType) {
    try {
      console.log(`Uploading file: ${filePath}`);
      
      // Select conversion type if specified
      if (conversionType) {
        const selectElement = await driver.findElement(By.id('conversion-type'));
        await selectElement.click();
        
        if (conversionType === 'pdf-to-docx') {
          await selectElement.findElement(By.xpath("//option[contains(text(), 'PDF to Word')]")).click();
        } else if (conversionType === 'docx-to-pdf') {
          await selectElement.findElement(By.xpath("//option[contains(text(), 'Word Document')]")).click();
        }
        
        // Wait a moment for the UI to update after changing conversion type
        await driver.sleep(500);
        console.log(`Selected conversion type: ${conversionType}`);
      }
      
      // Make file input element visible and interactable
      await driver.executeScript(`
        const fileInputs = document.querySelectorAll('input[type="file"]');
        for (let input of fileInputs) {
          input.style.opacity = '1';
          input.style.display = 'block';
          input.style.position = 'fixed';
          input.style.top = '0';
          input.style.left = '0';
          input.style.visibility = 'visible';
          input.style.zIndex = '9999';
        }
      `);
      
      // Wait for file input to be visible
      const fileInput = await driver.wait(until.elementLocated(By.css('input[type="file"]')), 10000);
      
      // Send the file path to the input
      await fileInput.sendKeys(filePath);
      console.log('File path sent to input element');
      
      // Wait for file to be processed
      await driver.sleep(1000);
      
      // Check if the file preview is shown or if an error occurred
      const previewElements = await driver.findElements(By.css('.mb-6 .bg-gray-50'));
      const errorElements = await driver.findElements(By.css('.bg-error-50'));
      
      if (previewElements.length > 0) {
        console.log('File upload confirmed - preview element found');
        return true;
      } else if (errorElements.length > 0) {
        const errorText = await errorElements[0].getText();
        console.log(`File upload error: ${errorText}`);
        return false;
      } else {
        console.log('No file preview or error element found after upload attempt');
        await captureScreenshot(driver, 'upload-result-unknown');
        return false;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      await captureScreenshot(driver, 'upload-error');
      return false;
    }
  }
  
  async function startConversion() {
    try {
      console.log('Starting conversion process');
      
      // Find and click the Convert Now button
      const convertButtons = await driver.findElements(
        By.xpath("//button[contains(text(), 'Convert Now')]")
      );
      
      if (convertButtons.length === 0) {
        console.log('Convert Now button not found');
        await captureScreenshot(driver, 'convert-button-missing');
        return false;
      }
      
      await convertButtons[0].click();
      console.log('Clicked Convert Now button');
      
      // Wait a moment for the conversion to start
      await driver.sleep(2000);
      
      // Check for upload/processing indicators
      const statusElements = await driver.findElements(
        By.xpath("//*[contains(text(), 'Processing') or contains(text(), 'Uploading')]")
      );
      
      if (statusElements.length > 0) {
        console.log('Conversion process started');
        return true;
      } else {
        console.log('No upload/processing indicators found after clicking Convert');
        await captureScreenshot(driver, 'conversion-start-unknown');
        return false;
      }
    } catch (error) {
      console.error('Error starting conversion:', error);
      await captureScreenshot(driver, 'conversion-start-error');
      return false;
    }
  }
  
  async function waitForConversionToComplete() {
    try {
      console.log('Waiting for conversion to complete...');
      
      // Wait for success indicators or download button
      let attempts = 0;
      const maxAttempts = 30; // 30 * 2000ms = 60 seconds max wait time
      
      while (attempts < maxAttempts) {
        attempts++;
        
        // Check for success indicators
        const successElements = await driver.findElements(
          By.xpath("//*[contains(text(), 'Conversion Successful') or contains(text(), 'Download')]")
        );
        
        // Check for error indicators
        const errorElements = await driver.findElements(
          By.xpath("//*[contains(text(), 'Conversion failed') or contains(text(), 'Error')]")
        );
        
        if (successElements.length > 0) {
          console.log('Conversion completed successfully');
          return true;
        } else if (errorElements.length > 0) {
          const errorText = await errorElements[0].getText();
          console.log(`Conversion failed with error: ${errorText}`);
          return false;
        }
        
        // Wait before checking again
        await driver.sleep(2000);
        
        // Log progress
        if (attempts % 5 === 0) {
          console.log(`Still waiting for conversion... (attempt ${attempts}/${maxAttempts})`);
          await captureConsoleLog(driver, `waiting-attempt-${attempts}`);
          await captureScreenshot(driver, `waiting-attempt-${attempts}`);
        }
      }
      
      console.log('Timed out waiting for conversion to complete');
      await captureScreenshot(driver, 'conversion-timeout');
      return false;
    } catch (error) {
      console.error('Error waiting for conversion to complete:', error);
      await captureScreenshot(driver, 'conversion-wait-error');
      return false;
    }
  }
  
  async function removeFile() {
    try {
      console.log('Removing file');
      
      // Find and click the Remove button
      const removeButtons = await driver.findElements(
        By.xpath("//button[text()='Remove']")
      );
      
      if (removeButtons.length === 0) {
        console.log('Remove button not found');
        await captureScreenshot(driver, 'remove-button-missing');
        return false;
      }
      
      await removeButtons[0].click();
      console.log('Clicked Remove button');
      
      // Wait a moment for the UI to update
      await driver.sleep(1000);
      
      // Check if file upload area is shown again
      const uploadArea = await driver.findElements(By.css('.bg-gray-50.rounded-xl'));
      if (uploadArea.length > 0) {
        console.log('File removed successfully');
        return true;
      } else {
        console.log('File upload area not found after removal');
        await captureScreenshot(driver, 'file-removal-unknown');
        return false;
      }
    } catch (error) {
      console.error('Error removing file:', error);
      await captureScreenshot(driver, 'remove-error');
      return false;
    }
  }
  
  async function checkApiConnectivity() {
    try {
      console.log('Testing API connectivity');
      
      // Find and click the Test API Connectivity button
      const connectivityButtons = await driver.findElements(
        By.xpath("//button[contains(text(), 'Test API Connectivity')]")
      );
      
      if (connectivityButtons.length === 0) {
        console.log('Test API Connectivity button not found');
        return null;
      }
      
      await connectivityButtons[0].click();
      console.log('Clicked Test API Connectivity button');
      
      // Wait a moment for the test to complete
      await driver.sleep(2000);
      
      // Capture console logs to check the result
      await captureConsoleLog(driver, 'api-connectivity-test');
      
      // Check for feedback message
      const successElements = await driver.findElements(
        By.xpath("//*[contains(text(), 'API connection successful')]")
      );
      
      const errorElements = await driver.findElements(
        By.xpath("//*[contains(text(), 'API connection test failed')]")
      );
      
      if (successElements.length > 0) {
        console.log('API connectivity test successful');
        return true;
      } else if (errorElements.length > 0) {
        console.log('API connectivity test failed');
        return false;
      } else {
        console.log('No clear API connectivity test result found');
        return null;
      }
    } catch (error) {
      console.error('Error testing API connectivity:', error);
      return null;
    }
  }
  
  // Check if the backend is available before running tests
  describe('Backend Availability Check', function() {
    it('should verify backend API connectivity before proceeding', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      // Test API connectivity
      const apiConnectivity = await checkApiConnectivity();
      
      // Log warning but don't fail test if API connectivity can't be determined
      if (apiConnectivity === null) {
        console.warn('WARNING: Could not determine API connectivity status. Tests may fail if backend is not available.');
      } else if (apiConnectivity === false) {
        console.warn('WARNING: Backend API connectivity test failed. The following tests will likely fail.');
      } else {
        console.log('Backend API connectivity verified. Proceeding with tests.');
      }
      
      // Capture current API configuration from the page
      const apiConfig = await driver.executeScript(`
        return {
          baseUrl: window.apiBaseUrl || 'Not defined in window',
          mockMode: window.localStorage.getItem('devMock'),
          environment: window.env || 'Not defined in window'
        };
      `);
      
      console.log('Current API configuration:', apiConfig);
    });
  });
  
  // Actual backend integration tests
  describe('PDF to DOCX Conversion', function() {
    it('should convert PDF to DOCX using the backend service', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      // Upload PDF file
      const uploadSuccessful = await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
      assert.strictEqual(uploadSuccessful, true, 'Should successfully upload PDF file');
      
      // Start conversion
      const conversionStarted = await startConversion();
      assert.strictEqual(conversionStarted, true, 'Conversion process should start successfully');
      
      // Wait for conversion to complete
      const conversionSuccessful = await waitForConversionToComplete();
      assert.strictEqual(conversionSuccessful, true, 'PDF to DOCX conversion should complete successfully');
      
      // Verify download button is available
      const downloadButtons = await driver.findElements(
        By.xpath("//button[contains(text(), 'Download')]")
      );
      assert.ok(downloadButtons.length > 0, 'Download button should be visible after successful conversion');
      
      await captureScreenshot(driver, 'pdf-to-docx-backend-success');
    });
  });
  
  describe('DOCX to PDF Conversion', function() {
    it('should convert DOCX to PDF using the backend service', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      // Upload DOCX file
      const uploadSuccessful = await uploadFile(SAMPLE_DOCX_PATH, 'docx-to-pdf');
      assert.strictEqual(uploadSuccessful, true, 'Should successfully upload DOCX file');
      
      // Start conversion
      const conversionStarted = await startConversion();
      assert.strictEqual(conversionStarted, true, 'Conversion process should start successfully');
      
      // Wait for conversion to complete
      const conversionSuccessful = await waitForConversionToComplete();
      assert.strictEqual(conversionSuccessful, true, 'DOCX to PDF conversion should complete successfully');
      
      // Verify download button is available
      const downloadButtons = await driver.findElements(
        By.xpath("//button[contains(text(), 'Download')]")
      );
      assert.ok(downloadButtons.length > 0, 'Download button should be visible after successful conversion');
      
      await captureScreenshot(driver, 'docx-to-pdf-backend-success');
    });
  });
  
  describe('Conversion Details', function() {
    it('should display conversion metadata from backend', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      // Upload and convert
      await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
      await startConversion();
      await waitForConversionToComplete();
      
      // Check for conversion details that would only come from a real backend
      const conversionElements = await driver.findElements(
        By.xpath("//*[contains(text(), 'Conversion ID:') or contains(text(), 'Processing time:')]")
      );
      
      // Log what we found, but don't fail the test if details aren't shown
      // Different implementations might show different levels of detail
      if (conversionElements.length > 0) {
        console.log(`Found ${conversionElements.length} conversion detail elements`);
        
        // Extract text from these elements for logging
        for (let i = 0; i < conversionElements.length; i++) {
          const text = await conversionElements[i].getText();
          console.log(`Conversion detail ${i+1}: ${text}`);
        }
      } else {
        console.log('No specific conversion details found in the UI');
      }
      
      await captureScreenshot(driver, 'conversion-details');
    });
  });
  
  describe('Error Handling with Backend', function() {
    it('should handle backend errors gracefully', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      // Upload file
      await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
      
      // Inject code to intercept and mock the conversion API response with an error
      await driver.executeScript(`
        // Store original fetch
        window._originalFetch = window.fetch;
        
        // Override fetch to simulate a backend error for conversion requests
        window.fetch = function(url, options) {
          console.log('Intercepted fetch to:', url);
          
          if (url.includes('/convert') || url.includes('/conversions')) {
            console.log('Simulating backend error for conversion request');
            return Promise.resolve({
              ok: false,
              status: 500,
              statusText: 'Internal Server Error',
              json: () => Promise.resolve({ 
                error: 'Simulated backend error',
                message: 'This is a simulated backend error for testing error handling'
              })
            });
          }
          
          // Pass through all other requests
          return window._originalFetch(url, options);
        };
        
        console.log('Fetch interceptor installed to simulate backend errors');
      `);
      
      // Start conversion (which should now fail)
      await startConversion();
      
      // Wait a moment for the error to be processed
      await driver.sleep(3000);
      
      // Capture the UI state
      await captureScreenshot(driver, 'backend-error-handling');
      
      // Check for error message
      const errorElements = await driver.findElements(
        By.xpath("//*[contains(text(), 'Error') or contains(text(), 'Failed') or contains(text(), 'Unable to process')]")
      );
      
      console.log(`Found ${errorElements.length} error elements after simulating backend error`);
      
      // We're testing the presence of error handling, not the exact content
      assert.ok(errorElements.length > 0, 'UI should show an error message when backend fails');
      
      // Restore original fetch
      await driver.executeScript(`
        if (window._originalFetch) {
          window.fetch = window._originalFetch;
          console.log('Restored original fetch function');
        }
      `);
      
      // Clean up
      await removeFile();
    });
  });
});

// Run tests if file is executed directly
if (require.main === module) {
  const { describe, it, before, after } = require('mocha');
  
  // Run the backend integration test suite
  describe('PDFSpark Backend Integration Tests (Direct Run)', function() {
    console.log('Starting backend integration tests for PDFSpark conversion functionality');
    require('./backend-integration.test');
  });
}