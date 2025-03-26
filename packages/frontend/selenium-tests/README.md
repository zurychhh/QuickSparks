# PDFSpark Selenium Tests

This directory contains end-to-end tests for the PDFSpark application using Selenium WebDriver.

## Test Structure

- **conversion.test.js**: Basic conversion functionality tests
- **comprehensive.test.js**: Comprehensive testing including edge cases
- **backend-integration.test.js**: Tests for integration with the real backend
- **run-tests.js**: Script for running tests
- **run-all-tests.js**: Script for running all tests and generating reports

## Running Tests

### Prerequisites

- Node.js and npm installed
- Chrome browser installed
- Backend service (optional for mock mode tests)

### Available Commands

Run these commands from the frontend package directory:

```bash
# Run basic tests
npm run test:selenium:basic

# Run comprehensive tests
npm run test:selenium:comprehensive

# Run backend integration tests (requires backend service)
npm run test:selenium:backend

# Run all tests and generate report
npm run test:selenium:all

# Run simple ES module test
npm run test:selenium:simple

# Run combination of front-end tests
npm run test:selenium:e2e

# Run full end-to-end tests with backend (if available)
npm run test:full-e2e
```

## Mock Mode

Most tests can run without a backend by using the application's built-in mock mode. To enable mock mode:

1. The tests automatically set `localStorage.setItem('devMock', 'true')`
2. For manual testing, use the "Mock Mode" button in the Developer Testing Panel

## Test Output

Tests generate the following outputs:

1. **Console logs**: Detailed test execution information
2. **Screenshots**: Visual state at key points during tests (stored in `screenshots/`)
3. **Reports**: When using `test:selenium:all`, reports are generated in `reports/`

## Troubleshooting

If tests fail:

1. Check that the frontend server is running (`npm run dev`)
2. Examine screenshots in the `screenshots/` directory 
3. Review console output for specific error messages
4. For backend integration tests, ensure the backend service is running

## Adding New Tests

When adding new tests:

1. Follow the patterns in existing test files
2. Make sure to handle file inputs properly (they are often hidden)
3. Add appropriate wait times and verification steps
4. Use the provided helper functions for common operations

## Contributing

Please follow the project's coding style when contributing to these tests.