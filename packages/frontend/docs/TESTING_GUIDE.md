# PDFSpark Testing Guide

This document provides a comprehensive guide to testing the PDFSpark application.

## Testing Architecture

PDFSpark uses a multi-layered testing approach:

1. **Unit Tests**: Test individual components and functions (Vitest)
2. **Integration Tests**: Test interactions between components (Vitest)
3. **End-to-End Tests**: Test the complete application workflow (Selenium)
4. **Cypress Tests**: Alternative E2E testing using Cypress
5. **Manual Tests**: Guided by test plans and user scenarios

## Test Directories

- `__tests__/`: Unit and integration tests
- `cypress/`: Cypress tests
- `selenium-tests/`: Selenium WebDriver tests
- `mjs-tests/`: ES Module compatible Selenium tests

## Running Tests

### Unit and Integration Tests

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### End-to-End Tests

```bash
# Cypress tests
npm run test:e2e
npm run cypress:open

# Selenium tests
npm run test:selenium:basic      # Basic conversion tests
npm run test:selenium:comprehensive # Comprehensive tests
npm run test:selenium:backend    # Backend integration tests
npm run test:selenium:all        # All tests with reports
npm run test:selenium:simple     # Simple ES module test
npm run test:selenium:e2e        # Combined frontend tests
npm run test:full-e2e            # Full stack tests with backend
```

### Performance and Other Tests

```bash
# Lighthouse performance tests
npm run lighthouse

# Security scans
npm run security-scan

# Bundle analysis
npm run analyze
```

## Mock Mode

PDFSpark includes a mock mode for testing without a backend. This is useful for UI development and testing.

To enable mock mode:

1. Use the Developer Testing Panel in the UI (Mock Mode button)
2. Set `localStorage.setItem('devMock', 'true')` in the browser console
3. The Selenium tests automatically enable mock mode

## Test Types

### Mock Mode Tests

These tests use the application's built-in mock mode to test the UI without a backend dependency:

- File selection and upload
- Conversion workflow
- UI states and transitions
- Success and error handling

### Backend Integration Tests

These tests connect to a real backend to verify:

- File conversion
- Authentication
- API error handling
- Rate limiting and quotas

## Test Outputs

Tests generate several types of output:

1. **Console logs**: Test progress and results
2. **Screenshots**: Visual state at key points (in `screenshots/`)
3. **Reports**: HTML reports for Selenium tests (in `reports/`)
4. **Coverage reports**: Code coverage analysis

## Best Practices

1. **Run tests before committing**: Use `npm test` to catch regressions
2. **Add tests for new features**: Maintain test coverage
3. **Include edge cases**: Test error conditions and unexpected inputs
4. **Keep tests independent**: Tests should not depend on each other
5. **Use mock mode for UI tests**: Faster and more reliable

## CI/CD Integration

Tests are integrated into the CI/CD pipeline and run:

1. On pull requests
2. On merges to main branch
3. Before production deployments

## Troubleshooting

If tests fail:

1. Check console output for specific errors
2. Review screenshots in the `screenshots/` directory
3. Check if the application is running (`npm run dev`)
4. Ensure required dependencies are installed
5. For backend tests, verify the backend service is running