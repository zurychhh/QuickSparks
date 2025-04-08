# PDFSpark Selenium Testing Guide

This document provides detailed information about the Selenium end-to-end test suite for the PDFSpark conversion functionality.

## Overview

The Selenium test suite provides comprehensive end-to-end testing of the PDFSpark conversion page functionality. These tests simulate real user interactions with the application in a browser environment.

## Test Files

The test suite consists of several files:

1. **conversion.test.js** - Basic test file containing fundamental conversion tests
2. **comprehensive.test.js** - Extended test suite with additional tests for edge cases, accessibility, and more
3. **backend-integration.test.js** - Tests specifically for integration with the real backend conversion service
4. **run-tests.js** - Script to run the tests, ensuring the Vite server is running

## Running Tests

### Prerequisites

- Node.js and npm installed
- Chrome browser installed (for the WebDriver)

### Commands

The following npm scripts are available for running the tests:

```bash
# Run all tests (comprehensive.test.js by default)
npm run test:selenium

# Run basic tests only
npm run test:selenium:basic

# Run comprehensive tests
npm run test:selenium:comprehensive

# Run backend integration tests (requires backend service to be running)
npm run test:selenium:backend
```

## Mock Mode vs. Real Backend

The tests can run in two modes:

1. **Mock Mode** - Uses a frontend mock implementation for testing without a backend dependency. This is the default mode for most tests.

2. **Real Backend Mode** - Connects to the actual backend conversion service. This mode is used by the backend integration tests.

### Enabling/Disabling Mock Mode

- Mock mode can be toggled using the Developer Testing Panel in the UI (if available)
- It can also be controlled via localStorage:
  ```javascript
  // Enable mock mode
  localStorage.setItem('devMock', 'true');
  
  // Disable mock mode
  localStorage.setItem('devMock', 'false');
  ```

## Test Categories

The tests cover the following aspects of the application:

1. **Navigation and UI** - Tests for basic page navigation and UI elements
2. **File Upload** - Tests for file selection and upload functionality
3. **Conversion Process** - Tests for the actual conversion process
4. **API Connectivity** - Tests for API connection validation
5. **Edge Cases and Error Handling** - Tests for handling large files, errors, and recovery
6. **Accessibility** - Tests for keyboard navigation and screen reader support
7. **Backend Integration** - Tests for integration with the real backend service

## Debugging Failed Tests

### Screenshots

The test runner automatically captures screenshots at key points in the test execution. These screenshots are saved in the `screenshots` directory and can be helpful for debugging failed tests.

### Console Logs

Browser console logs are captured during test execution and displayed in the test output. These logs can provide valuable information about errors or warnings that occurred during testing.

## Test Utilities

The test suite includes several utility functions to help with testing:

- **navigateToConversionPage()** - Navigates to the conversion page
- **uploadFile()** - Uploads a file for conversion
- **startConversion()** - Starts the conversion process
- **waitForConversionToComplete()** - Waits for the conversion to complete
- **removeFile()** - Removes the currently selected file
- **checkApiConnectivity()** - Tests API connectivity
- **captureScreenshot()** - Captures a screenshot for debugging
- **captureConsoleLog()** - Captures browser console logs

## Test Data

The test suite creates sample test files for use in the tests:

- **sample-test.pdf** - A simple PDF-like file for testing
- **sample-test.docx** - A simple DOCX-like file for testing
- **large-test.pdf** - A larger PDF-like file for testing
- **invalid-file.txt** - An invalid file for testing error handling

## Continuous Integration

These tests can be integrated into a CI/CD pipeline for automated testing. Here's an example configuration for a CI environment:

```yaml
test:
  stage: test
  script:
    # Install dependencies
    - npm ci
    
    # Start the backend service (if needed)
    - npm run start:backend
    
    # Run the tests
    - npm run test:selenium
    
    # Run backend integration tests
    - npm run test:selenium:backend
  artifacts:
    paths:
      - screenshots/
    when: always
```

## Extending the Tests

To add new tests:

1. Add new test cases to the existing test files
2. For new test categories, create new test files following the same pattern
3. Update the run-tests.js file if needed to support new test files

## Common Issues and Solutions

1. **Tests fail with "unable to find element"**
   - Check if the element selector is correct
   - Ensure the page has loaded completely before trying to find elements
   - Try using different wait strategies

2. **Tests time out waiting for conversion to complete**
   - Check if the backend service is running correctly
   - Increase the timeout value in the test configuration
   - Check network connectivity

3. **File uploads fail**
   - Ensure the test files exist in the correct location
   - Check if the file input element is accessible and interactable

4. **Tests pass in mock mode but fail with real backend**
   - Verify the backend service is running
   - Check network connectivity
   - Ensure the API URLs are configured correctly

## Conclusion

The Selenium test suite provides comprehensive testing of the PDFSpark conversion functionality. By running these tests regularly, you can ensure that the application continues to function as expected.