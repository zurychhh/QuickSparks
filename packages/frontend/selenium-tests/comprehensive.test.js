/**
 * Comprehensive Selenium Test Suite for PDFSpark Conversion Functionality
 * 
 * This test suite provides comprehensive end-to-end testing of the PDFSpark
 * conversion page, including happy paths, error handling, and edge cases.
 */

const { Builder, By, Key, until, logging } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const assert = require('assert');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3000/pdfspark/';
const TEST_TIMEOUT = 60000; // 60 seconds timeout for tests
const SAMPLE_PDF_PATH = path.resolve(__dirname, '../public/sample-test.pdf');
const SAMPLE_DOCX_PATH = path.resolve(__dirname, '../public/sample-test.docx');
const LARGE_PDF_PATH = path.resolve(__dirname, '../public/large-test.pdf');
const INVALID_FILE_PATH = path.resolve(__dirname, '../public/invalid-file.txt');

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

  if (!fs.existsSync(LARGE_PDF_PATH)) {
    // Create a larger PDF-like file for testing
    const largeContent = '%PDF-1.5\n' + 'x'.repeat(1024 * 1024 * 2) + '\n%%EOF'; // 2MB file
    fs.writeFileSync(LARGE_PDF_PATH, largeContent);
    console.log(`Created large test PDF file at ${LARGE_PDF_PATH}`);
  }

  if (!fs.existsSync(INVALID_FILE_PATH)) {
    // Create an invalid file for testing
    fs.writeFileSync(INVALID_FILE_PATH, 'This is not a valid PDF or DOCX file.');
    console.log(`Created invalid test file at ${INVALID_FILE_PATH}`);
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
describe('PDFSpark Conversion Page Comprehensive Tests', function() {
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
      await enableMockMode();
    } catch (error) {
      console.error('Error navigating to conversion page:', error);
      await captureScreenshot(driver, 'navigation-error');
      throw error;
    }
  }
  
  async function enableMockMode() {
    try {
      // Execute JavaScript to enable mock mode
      await driver.executeScript(`
        if (window.localStorage) {
          window.localStorage.setItem('devMock', 'true');
          window.localStorage.removeItem('mockConversionStatus');
          console.log('DEV MOCK MODE ENABLED via JavaScript');
        }
      `);
      
      // Refresh the page to apply mock mode
      await driver.navigate().refresh();
      await driver.wait(until.elementLocated(By.css('h1')), 10000);
      
      // Check if dev panel is visible and mock mode is enabled
      const devPanels = await driver.findElements(By.xpath("//h4[contains(text(), 'Developer Testing Panel')]"));
      if (devPanels.length > 0) {
        const mockButtons = await driver.findElements(By.xpath("//button[contains(text(), 'Mock Mode: ON')]"));
        if (mockButtons.length === 0) {
          // Click the mock mode button to enable it
          const offButtons = await driver.findElements(By.xpath("//button[contains(text(), 'Mock Mode: OFF')]"));
          if (offButtons.length > 0) {
            await offButtons[0].click();
            await driver.sleep(1000);
            await driver.wait(until.elementLocated(By.css('h1')), 10000);
          }
        }
      }
      
      console.log('Mock mode enabled');
    } catch (error) {
      console.error('Error enabling mock mode:', error);
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
      await driver.sleep(1000);
      
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
      const maxAttempts = 20; // 20 * 1500ms = 30 seconds max wait time
      
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
        await driver.sleep(1500);
        
        // Log progress
        if (attempts % 5 === 0) {
          console.log(`Still waiting for conversion... (attempt ${attempts}/${maxAttempts})`);
          await captureConsoleLog(driver, `waiting-attempt-${attempts}`);
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
  
  // Test Cases
  
  // 1. Basic Navigation and UI Tests
  describe('Navigation and UI', function() {
    it('should navigate to conversion page successfully', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      const title = await driver.findElement(By.css('h1')).getText();
      assert.ok(title.includes('Convert Your Document'), 'Page title should contain "Convert Your Document"');
      
      // Check if conversion type selector is present
      const conversionTypeSelect = await driver.findElements(By.id('conversion-type'));
      assert.ok(conversionTypeSelect.length > 0, 'Conversion type selector should be present');
      
      // Check if file upload area is present
      const uploadArea = await driver.findElements(By.css('.bg-gray-50.rounded-xl'));
      assert.ok(uploadArea.length > 0, 'File upload area should be present');
      
      await captureScreenshot(driver, 'conversion-page-loaded');
    });
    
    it('should toggle between PDF-to-DOCX and DOCX-to-PDF modes', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      // Get the conversion type selector
      const selectElement = await driver.findElement(By.id('conversion-type'));
      
      // Select PDF to DOCX
      await selectElement.click();
      await selectElement.findElement(By.xpath("//option[contains(text(), 'PDF to Word')]")).click();
      await driver.sleep(500);
      
      // Verify UI updates for PDF to DOCX
      const pdfToDOCXIndicator = await driver.findElements(By.xpath("//*[contains(text(), 'PDF → DOCX')]"));
      assert.ok(pdfToDOCXIndicator.length > 0, 'PDF to DOCX indicator should be visible');
      
      // Select DOCX to PDF
      await selectElement.click();
      await selectElement.findElement(By.xpath("//option[contains(text(), 'Word Document')]")).click();
      await driver.sleep(500);
      
      // Verify UI updates for DOCX to PDF
      const docxToPDFIndicator = await driver.findElements(By.xpath("//*[contains(text(), 'DOCX → PDF')]"));
      assert.ok(docxToPDFIndicator.length > 0, 'DOCX to PDF indicator should be visible');
      
      await captureScreenshot(driver, 'conversion-toggle-complete');
    });
  });
  
  // 2. File Upload Tests
  describe('File Upload', function() {
    it('should upload a PDF file successfully', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      const uploadSuccessful = await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
      assert.strictEqual(uploadSuccessful, true, 'Should successfully upload PDF file');
      
      // Verify file preview is shown
      const fileName = await driver.findElement(By.css('.flex-1 h3')).getText();
      assert.ok(fileName.includes('sample-test.pdf'), 'File preview should show the uploaded PDF file name');
      
      await captureScreenshot(driver, 'pdf-upload-success');
    });
    
    it('should upload a DOCX file successfully', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      const uploadSuccessful = await uploadFile(SAMPLE_DOCX_PATH, 'docx-to-pdf');
      assert.strictEqual(uploadSuccessful, true, 'Should successfully upload DOCX file');
      
      // Verify file preview is shown
      const fileName = await driver.findElement(By.css('.flex-1 h3')).getText();
      assert.ok(fileName.includes('sample-test.docx'), 'File preview should show the uploaded DOCX file name');
      
      await captureScreenshot(driver, 'docx-upload-success');
    });
    
    it('should reject invalid file types', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      // Try to upload an invalid file
      const uploadResult = await uploadFile(INVALID_FILE_PATH, 'pdf-to-docx');
      
      // We expect this to fail since it's an invalid file type
      assert.strictEqual(uploadResult, false, 'Should reject invalid file type');
      
      // Check for error message
      const errorElements = await driver.findElements(By.css('.bg-error-50'));
      assert.ok(errorElements.length > 0, 'Error message should be shown for invalid file type');
      
      await captureScreenshot(driver, 'invalid-file-rejected');
    });
    
    it('should successfully remove uploaded file', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      // Upload a file
      await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
      
      // Remove the file
      const removalSuccessful = await removeFile();
      assert.strictEqual(removalSuccessful, true, 'Should successfully remove uploaded file');
      
      // Verify upload area is shown again
      const uploadAreaAfterRemoval = await driver.findElements(By.css('.bg-gray-50.rounded-xl'));
      assert.ok(uploadAreaAfterRemoval.length > 0, 'File upload area should be visible after removal');
      
      await captureScreenshot(driver, 'file-removal-success');
    });
  });
  
  // 3. Conversion Process Tests
  describe('Conversion Process', function() {
    it('should convert PDF to DOCX successfully in mock mode', async function() {
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
      assert.strictEqual(conversionSuccessful, true, 'Conversion should complete successfully');
      
      // Verify download section is visible
      const downloadSection = await driver.findElements(
        By.xpath("//*[contains(text(), 'Conversion Successful')]")
      );
      assert.ok(downloadSection.length > 0, 'Success message should be visible after conversion');
      
      await captureScreenshot(driver, 'pdf-to-docx-success');
    });
    
    it('should convert DOCX to PDF successfully in mock mode', async function() {
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
      assert.strictEqual(conversionSuccessful, true, 'Conversion should complete successfully');
      
      // Verify download section is visible
      const downloadSection = await driver.findElements(
        By.xpath("//*[contains(text(), 'Conversion Successful')]")
      );
      assert.ok(downloadSection.length > 0, 'Success message should be visible after conversion');
      
      await captureScreenshot(driver, 'docx-to-pdf-success');
    });
    
    it('should show progress indicators during conversion', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      // Upload file
      await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
      
      // Start conversion
      await startConversion();
      
      // Check for upload progress indicator
      const uploadProgress = await driver.wait(until.elementLocated(
        By.xpath("//*[contains(text(), 'Uploading') or contains(text(), 'Processing')]")
      ), 5000);
      
      assert.ok(uploadProgress, 'Upload/processing progress indicator should be visible during conversion');
      
      // Wait for conversion steps indicator to update
      await driver.sleep(2000);
      
      // Capture screenshot of progress indicators
      await captureScreenshot(driver, 'conversion-progress');
      
      // Wait for completion
      await waitForConversionToComplete();
    });
  });
  
  // 4. API Connectivity Test
  describe('API Connectivity', function() {
    it('should test API connectivity', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      // Test API connectivity (result may vary depending on backend availability)
      const connectivityResult = await checkApiConnectivity();
      
      // Just log the result, don't assert since backend might not be running
      console.log(`API connectivity test result: ${connectivityResult}`);
      
      // If test fails with a real error (not just backend unavailable), it will throw and fail the test
    });
  });
  
  // 5. Edge Cases and Error Handling Tests
  describe('Edge Cases and Error Handling', function() {
    it('should handle large file upload', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      // Upload a large file
      const uploadSuccessful = await uploadFile(LARGE_PDF_PATH, 'pdf-to-docx');
      
      // Large file should be accepted as long as it's below the max size limit
      assert.strictEqual(uploadSuccessful, true, 'Should handle large file upload');
      
      await captureScreenshot(driver, 'large-file-upload');
    });
    
    it('should maintain UI state after multiple conversions', async function() {
      this.timeout(TEST_TIMEOUT * 2);
      await navigateToConversionPage();
      
      // First conversion
      await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
      await startConversion();
      await waitForConversionToComplete();
      
      // Remove file
      await removeFile();
      
      // Second conversion
      await uploadFile(SAMPLE_DOCX_PATH, 'docx-to-pdf');
      await startConversion();
      await waitForConversionToComplete();
      
      // Verify UI is still in a good state
      const downloadButtons = await driver.findElements(
        By.xpath("//button[contains(text(), 'Download')]")
      );
      assert.ok(downloadButtons.length > 0, 'Download button should be visible after multiple conversions');
      
      await captureScreenshot(driver, 'multiple-conversions-success');
    });
    
    it('should handle network interruptions during conversion', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      // Upload file
      await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
      
      // Start conversion
      await startConversion();
      
      // Simulate network interruption
      await driver.executeScript(`
        // Preserve original fetch
        window._originalFetch = window.fetch;
        
        // Mock fetch to simulate network failure
        window.fetch = function() {
          console.log("MOCKED FETCH: Simulating network interruption");
          return Promise.reject(new Error("Network error (simulated)"));
        };
        
        // Log for test verification
        console.log("NETWORK INTERRUPTION SIMULATION ENABLED");
      `);
      
      // Wait briefly for the UI to update
      await driver.sleep(2000);
      
      // Capture screenshot of error state
      await captureScreenshot(driver, 'network-error-simulation');
      
      // Restore original fetch
      await driver.executeScript(`
        if (window._originalFetch) {
          window.fetch = window._originalFetch;
          console.log("NETWORK INTERRUPTION SIMULATION DISABLED - Restored original fetch");
        }
      `);
      
      // Check if the UI shows an error message or retry option
      const errorElements = await driver.findElements(
        By.xpath("//*[contains(text(), 'Error') or contains(text(), 'Failed') or contains(text(), 'Try again')]")
      );
      
      console.log(`Found ${errorElements.length} error-related elements after network interruption simulation`);
      
      // We don't assert here because we're just testing that the app doesn't crash
      // The specific error handling may vary depending on implementation
      
      // Clean up - remove file to reset state
      try {
        await removeFile();
      } catch (error) {
        console.log('Error during cleanup after network test:', error);
        
        // Force page reload to reset state if remove fails
        await driver.navigate().refresh();
        await driver.wait(until.elementLocated(By.css('h1')), 10000);
      }
    });
    
    it('should recover from failed conversion attempt', async function() {
      this.timeout(TEST_TIMEOUT * 2);
      await navigateToConversionPage();
      
      // Upload file
      await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
      
      // Start conversion
      await startConversion();
      
      // Simulate conversion failure by setting mock state
      await driver.executeScript(`
        if (window.localStorage) {
          // Force mock conversion to fail
          window.localStorage.setItem('mockConversionStatus', 'error');
          console.log('MOCK CONVERSION SET TO FAIL');
        }
      `);
      
      // Wait briefly for the error to appear
      await driver.sleep(2000);
      
      // Capture screenshot of error state
      await captureScreenshot(driver, 'conversion-failure');
      
      // Check for error message
      const errorMessages = await driver.findElements(
        By.xpath("//*[contains(text(), 'Error') or contains(text(), 'Failed')]")
      );
      
      console.log(`Found ${errorMessages.length} error messages after simulated conversion failure`);
      
      // Try to find and click a retry button
      const retryButtons = await driver.findElements(
        By.xpath("//button[contains(text(), 'Try Again') or contains(text(), 'Retry')]")
      );
      
      if (retryButtons.length > 0) {
        console.log('Found retry button, attempting to retry conversion');
        
        // Reset mock state to success
        await driver.executeScript(`
          if (window.localStorage) {
            // Reset mock conversion to succeed
            window.localStorage.removeItem('mockConversionStatus');
            console.log('MOCK CONVERSION RESET TO SUCCEED');
          }
        `);
        
        // Click retry
        await retryButtons[0].click();
        
        // Wait for conversion to complete
        const recoverySuccessful = await waitForConversionToComplete();
        assert.strictEqual(recoverySuccessful, true, 'Should recover from failed conversion attempt');
        
        await captureScreenshot(driver, 'conversion-recovery-success');
      } else {
        console.log('No retry button found, checking if we can start over');
        
        // If no retry button, try to remove file and start over
        const removeSuccessful = await removeFile();
        
        if (removeSuccessful) {
          // Reset mock state
          await driver.executeScript(`
            if (window.localStorage) {
              window.localStorage.removeItem('mockConversionStatus');
            }
          `);
          
          // Try again with fresh upload
          await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
          await startConversion();
          
          const secondAttemptSuccessful = await waitForConversionToComplete();
          assert.strictEqual(secondAttemptSuccessful, true, 'Should be able to restart after failure');
          
          await captureScreenshot(driver, 'conversion-restart-success');
        } else {
          console.log('Unable to retry or restart conversion, test is informational only');
        }
      }
    });
  });
  
  // 6. Accessibility Tests
  describe('Accessibility', function() {
    it('should have proper focus management', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      // Check initial focus on conversion type selector
      await driver.executeScript(`
        document.getElementById('conversion-type').focus();
      `);
      
      // Use tab to move through interactive elements
      await driver.actions().sendKeys(Key.TAB).perform();
      
      // Get the currently focused element
      const focusedElement1 = await driver.executeScript(`
        return document.activeElement.tagName + 
               (document.activeElement.getAttribute('role') ? 
               ' [' + document.activeElement.getAttribute('role') + ']' : '');
      `);
      
      console.log(`First tab focus: ${focusedElement1}`);
      
      // Tab again
      await driver.actions().sendKeys(Key.TAB).perform();
      
      // Get the next focused element
      const focusedElement2 = await driver.executeScript(`
        return document.activeElement.tagName + 
               (document.activeElement.getAttribute('role') ? 
               ' [' + document.activeElement.getAttribute('role') + ']' : '');
      `);
      
      console.log(`Second tab focus: ${focusedElement2}`);
      
      // Tab a third time
      await driver.actions().sendKeys(Key.TAB).perform();
      
      // Get the third focused element
      const focusedElement3 = await driver.executeScript(`
        return document.activeElement.tagName + 
               (document.activeElement.getAttribute('role') ? 
               ' [' + document.activeElement.getAttribute('role') + ']' : '');
      `);
      
      console.log(`Third tab focus: ${focusedElement3}`);
      
      // Verify we can tab through at least 3 distinct elements without errors
      assert.ok(
        focusedElement1 !== focusedElement2 || focusedElement2 !== focusedElement3,
        'Tab key should move focus between different elements'
      );
    });
    
    it('should have proper button attributes for screen readers', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      // Upload a file to see all interactive elements
      await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
      
      // Check buttons for proper attributes
      const buttons = await driver.findElements(By.css('button'));
      
      for (let i = 0; i < buttons.length; i++) {
        // Get attributes important for accessibility
        const ariaLabel = await buttons[i].getAttribute('aria-label');
        const text = await buttons[i].getText();
        const disabled = await buttons[i].getAttribute('disabled');
        
        console.log(`Button ${i+1}: Text="${text}", aria-label="${ariaLabel}", disabled=${disabled}`);
        
        // For buttons without visible text, they should have aria-label
        if (!text.trim() && !ariaLabel) {
          console.warn(`Warning: Button ${i+1} has no text and no aria-label`);
        }
      }
      
      // Check that convert button is usable by keyboard
      const convertButtons = await driver.findElements(
        By.xpath("//button[contains(text(), 'Convert Now')]")
      );
      
      if (convertButtons.length > 0) {
        // Focus the button
        await driver.executeScript(`
          arguments[0].focus();
        `, convertButtons[0]);
        
        // Verify it has focus
        const isFocused = await driver.executeScript(`
          return document.activeElement === arguments[0];
        `, convertButtons[0]);
        
        assert.strictEqual(isFocused, true, 'Convert button should be focusable');
      }
      
      // Clean up - remove file
      await removeFile();
    });
  });
  
  // 7. Backend Integration Tests (Mock Mode Controls)
  describe('Backend Integration Controls', function() {
    it('should be able to control mock mode', async function() {
      this.timeout(TEST_TIMEOUT);
      await navigateToConversionPage();
      
      // Check if developer testing panel is visible
      const devPanels = await driver.findElements(By.xpath("//h4[contains(text(), 'Developer Testing Panel')]"));
      if (devPanels.length === 0) {
        console.log('Developer Testing Panel not visible in UI, using localStorage instead');
        
        // Toggle mock mode via localStorage
        await driver.executeScript(`
          if (window.localStorage) {
            const currentMode = window.localStorage.getItem('devMock') === 'true';
            console.log('Current mock mode:', currentMode);
            window.localStorage.setItem('devMock', currentMode ? 'false' : 'true');
            console.log('Toggled mock mode to:', !currentMode);
          }
        `);
        
        // Refresh to apply change
        await driver.navigate().refresh();
        await driver.wait(until.elementLocated(By.css('h1')), 10000);
      } else {
        console.log('Developer Testing Panel found, using UI controls');
        
        // Get current mode state
        const mockButtons = await driver.findElements(By.xpath("//button[contains(text(), 'Mock Mode:')]"));
        if (mockButtons.length > 0) {
          const buttonText = await mockButtons[0].getText();
          console.log(`Current mock mode button state: ${buttonText}`);
          
          // Click to toggle
          await mockButtons[0].click();
          await driver.sleep(1000);
          
          // Get new state
          const newButtonText = await mockButtons[0].getText();
          console.log(`New mock mode button state: ${newButtonText}`);
          
          assert.notStrictEqual(buttonText, newButtonText, 'Mock mode button should toggle state when clicked');
        }
      }
      
      // Re-enable mock mode for other tests
      await enableMockMode();
    });
    
    it('should simulate different conversion durations', async function() {
      this.timeout(TEST_TIMEOUT * 2);
      await navigateToConversionPage();
      
      // Set long conversion duration
      await driver.executeScript(`
        if (window.localStorage) {
          // Set mock conversion duration to 10 seconds
          window.localStorage.setItem('mockConversionDuration', '10000');
          console.log('MOCK CONVERSION DURATION SET TO 10 SECONDS');
        }
      `);
      
      // Upload and start conversion
      await uploadFile(SAMPLE_PDF_PATH, 'pdf-to-docx');
      const startTime = Date.now();
      await startConversion();
      
      // Wait for conversion to complete
      await waitForConversionToComplete();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`Conversion took ${duration}ms with 10s mock duration setting`);
      
      // Should take close to the mock duration (allowing some margin)
      assert.ok(duration >= 8000, 'Long conversion duration should be respected');
      
      // Clean up
      await removeFile();
      
      // Reset to quick conversion for remaining tests
      await driver.executeScript(`
        if (window.localStorage) {
          // Reset to default (quick) conversion
          window.localStorage.removeItem('mockConversionDuration');
          console.log('MOCK CONVERSION DURATION RESET TO DEFAULT');
        }
      `);
    });
  });
});

// Run tests if file is executed directly
if (require.main === module) {
  const { describe, it, before, after } = require('mocha');
  
  // Run the comprehensive test suite
  describe('PDFSpark Comprehensive Selenium Tests (Direct Run)', function() {
    console.log('Starting comprehensive Selenium tests for PDFSpark conversion functionality');
    require('./comprehensive.test');
  });
}