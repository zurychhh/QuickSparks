# QuickSparks Testing

This directory contains integration and end-to-end tests for the QuickSparks project.

## Test Structure

- **`integration/`**: Integration tests that verify interactions between multiple components
  - API Gateway <-> Service tests
  - Service <-> Database tests
  - Service <-> Service tests

- **`e2e/`**: End-to-end tests that verify complete user flows
  - User registration and authentication flows
  - File conversion flows
  - Payment processing flows

## Running Tests

```bash
# Run all tests
pnpm test

# Run integration tests only
pnpm test:integration

# Run e2e tests only
pnpm test:e2e
```

## Test Guidelines

1. **Independence**: Tests should be independent and not rely on each other's state
2. **Setup/Teardown**: Each test should set up its environment and clean up afterward
3. **Clear Assertions**: Tests should have clear assertions with helpful error messages
4. **Mocking External Services**: Use mocks for external services, but test real integrations where possible
5. **Test Real User Flows**: E2E tests should mimic real user behavior

## Test Environment

Tests run against containerized versions of all services using Docker Compose. The test environment is isolated from development and production environments.

## Test Data

Sample test files are stored in the `fixtures` directory within each test suite. These include sample PDFs, images, and other files needed for testing conversion processes.

## CI Integration

These tests are automatically run in the CI pipeline:
- Integration tests run on all pull requests
- E2E tests run on merges to the main branch
- Both run before releases

## Coverage Reports

Test coverage reports are generated after test runs and can be found in the `/coverage` directory.