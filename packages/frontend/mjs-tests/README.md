# PDFSpark ES Module Tests

This directory contains end-to-end tests for the PDFSpark application using ES modules format.

## Why ES Module Tests?

The PDFSpark frontend project uses ES modules (`"type": "module"` in package.json), which can cause compatibility issues with CommonJS tests. These tests use the ES module format to avoid those issues.

## Test Files

- **basic-test.mjs**: A simple test for the conversion functionality

## Running Tests

```bash
# Run the basic ES module test
npm run test:selenium:simple
```

## Test Implementation Details

These tests were designed to handle several challenges:

1. **ES Module Compatibility**: Using `.mjs` extension and ES module syntax
2. **Hidden File Inputs**: Strategies for interacting with hidden file input elements
3. **React Compatibility**: Working with React's component structure
4. **Mock Mode**: Using the application's mock mode for reliable testing

## Test Strategies

The tests use several strategies to handle common challenges:

### Finding Hidden Elements

React often uses hidden file inputs for custom file selection UIs. Our tests:

1. Make hidden file inputs visible via JavaScript
2. Inject a test file input if needed
3. Look for and interact with related visible buttons

### Working with Mock Mode

Our tests enable mock mode through localStorage to avoid backend dependencies:

```javascript
await driver.executeScript(`
  if (window.localStorage) {
    window.localStorage.setItem('devMock', 'true');
    console.log('DEV MOCK MODE ENABLED via JavaScript');
  }
`);
```

### Verification Techniques

The tests verify conversion success through multiple approaches:

1. Checking page text for success indicators
2. Looking for specific buttons that appear after conversion
3. Capturing screenshots for visual verification

## Adding New Tests

When adding new ES module tests:

1. Use the `.mjs` extension for ES module syntax
2. Import dependencies using ES module syntax (`import` instead of `require`)
3. Use the techniques in the basic test for handling file inputs
4. Always enable mock mode for reliable testing

## Compatibility

These tests should work on any system with:

1. Node.js 16+ (for ESM support)
2. Chrome browser
3. Selenium WebDriver and ChromeDriver