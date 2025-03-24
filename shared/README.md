# Shared Resources

This directory contains common resources shared across all services in the QuickSparks project.

## Structure

- **`config/`**: Common configuration files that can be used across different services.
  - Contains environment-specific configuration files
  - Defaults and configuration schema definitions
  - Utilities for loading and validating configurations

- **`middlewares/`**: Common middleware functions that can be reused across different services.
  - Error handling middleware
  - Logging middleware
  - Authentication middleware
  - Request validation middleware

- **`utils/`**: Utility functions and helpers shared across services.
  - File handling utilities
  - Date/time utilities
  - String manipulation functions
  - Security utilities
  - Logging utilities

## Usage

Import these shared resources directly into your service code:

```javascript
// For middleware
const { errorHandler } = require('../../shared/middlewares/error-handler');

// For configuration
const { getConfig } = require('../../shared/config');

// For utilities
const { formatDate } = require('../../shared/utils/date-utils');
```

## Guidelines

1. **Keep it simple**: Only add code to the shared directory if it's genuinely needed by multiple services.
2. **Maintain backward compatibility**: Changes to shared code can affect multiple services, so avoid breaking changes.
3. **Document everything**: All shared utilities should be well-documented with JSDoc comments.
4. **Test thoroughly**: Shared code should have comprehensive tests to ensure reliability.