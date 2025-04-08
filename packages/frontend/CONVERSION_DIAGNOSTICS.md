# Conversion Functionality Diagnostics

This document describes the diagnostic tools and approaches implemented to help debug and test the conversion functionality in PDFSpark.

## Diagnostic Tools Overview

We've implemented several diagnostic tools to help with debugging and testing the conversion functionality:

1. **Enhanced API Logging**: Detailed logs for all API requests and responses
2. **Mock API Mode**: Simulation of backend responses for frontend testing
3. **Developer Testing Panel**: UI controls to manage testing parameters
4. **API Connectivity Testing**: Function to verify backend availability
5. **State Tracking**: Detailed logging of component state throughout the conversion process

## Using the Diagnostic Tools

### Enhanced API Logging

Enhanced API logging has been added to the API service to provide detailed information about requests and responses:

```javascript
// Request logging in console
console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
  baseURL: config.baseURL,
  headers: config.headers,
  data: config.data,
  params: config.params
});

// Response logging in console
console.log(`API Response: ${response.status} ${response.config.url}`, {
  data: response.data,
  headers: response.headers
});

// Error logging in console
console.error('API Error:', {
  message: error.message,
  status: error.response?.status,
  statusText: error.response?.statusText,
  url: error.config?.url,
  method: error.config?.method,
  data: error.response?.data,
  requestData: error.config?.data
});
```

To see these logs, open the browser's developer console while using the conversion page.

### Mock API Mode

Mock API mode allows you to test the conversion functionality without a running backend. It intercepts API requests and provides simulated responses.

To enable mock mode:

1. In development mode, find the "Developer Testing Panel" at the bottom of the conversion page
2. Click the "Mock Mode: OFF" button to toggle it to "Mock Mode: ON"
3. The page will refresh with mock mode enabled

Alternatively, you can enable it programmatically in the console:

```javascript
import { devUtils } from '../services/api';
devUtils.enableMockMode();
```

### Developer Testing Panel

The Developer Testing Panel provides UI controls for various diagnostic functions:

- **Test API Connectivity**: Checks if the backend API is accessible
- **Mock Mode Toggle**: Enables/disables the mock API mode
- **Set Test Auth Token**: Sets a test authentication token for backend requests
- **Reset Mock State**: Resets the mock simulation state to start from the beginning

The panel is only available in development mode (`import.meta.env.DEV`).

### API Connectivity Testing

The `testApiConnectivity` function tests connectivity to the backend API:

```javascript
const testApiConnectivity = async (): Promise<void> => {
  try {
    console.log('Testing API connectivity...');
    console.log('Current API URL:', import.meta.env.VITE_API_URL || '/api');
    
    // Test direct API access using fetch
    // Test with axios
    // Multiple approaches to verify connectivity
  } catch (error) {
    console.error('API connectivity test error:', error);
  }
};
```

This function tests connectivity using multiple approaches and logs the results to the console.

### State Tracking

Detailed logging has been added throughout the conversion process to track component state:

```javascript
// In handleConvert function
console.log('Starting conversion with settings:', {
  conversionType: conversionOptions.conversionType,
  quality: conversionOptions.quality,
  preserveFormatting: conversionOptions.preserveFormatting,
  fileSize: selectedFile.size,
  fileName: selectedFile.name,
  fileType: selectedFile.type
});

// Upload progress logging
console.log('Upload progress:', progress);

// Conversion status logging
console.log('Polling conversion status for ID:', conversionId);
console.log('Status response:', statusResponse.data);
console.log(`Conversion in progress, status: ${status}`);
```

## Troubleshooting Common Issues

### 1. Backend Connectivity Issues

**Symptoms**: API requests fail with network errors, "Test API Connectivity" shows failures

**Diagnostic Steps**:
1. Check if backend service is running: `ps aux | grep conversion-service`
2. Verify API URL in .env file: `VITE_API_URL=http://localhost:5000/api`
3. Check browser console for CORS errors
4. Use `curl` to test API directly: `curl http://localhost:5000/api/health`

**Solution**:
- Start backend service if not running
- Fix API URL if incorrect
- Address CORS issues in backend service if present

### 2. File Upload Problems

**Symptoms**: File upload progress starts but never completes, or upload fails with errors

**Diagnostic Steps**:
1. Check file size (max size is 10MB)
2. Check file type matches conversion type
3. Examine browser network tab for upload request
4. Check console logs for upload progress and errors

**Solution**:
- Use smaller test files
- Ensure file type matches conversion type (PDF for PDF-to-DOCX, DOCX for DOCX-to-PDF)
- Enable mock mode to test frontend flow independently

### 3. Conversion Process Hangs

**Symptoms**: Upload completes but conversion never finishes

**Diagnostic Steps**:
1. Check polling for status updates in console logs
2. Verify conversion ID is being passed correctly
3. Check backend logs for conversion job processing
4. Test with mock mode to see if frontend flow works correctly

**Solution**:
- Check backend job queue and processing
- Verify status polling is working correctly
- Reset conversion state and try again

### 4. Download Failures

**Symptoms**: Conversion completes but download fails or returns empty/corrupted file

**Diagnostic Steps**:
1. Check download token generation in console logs
2. Examine download URL construction
3. Verify file exists on backend
4. Test with different file types

**Solution**:
- Verify download token generation
- Check file storage on backend
- Test with simple/small files first

## Running in Mock Mode

Mock mode is useful for frontend development and testing when the backend is unavailable:

1. Enable mock mode using the Developer Testing Panel
2. Upload a file - mock mode will simulate successful upload with progress
3. Conversion will be simulated with status updates
4. Download will be simulated with a mock download token

Mock mode follows this sequence:
1. First status check: "pending"
2. Second status check: "processing"
3. Third status check: "completed"

Each step includes realistic delays to simulate actual processing time.

## Adding Custom Diagnostic Points

To add your own diagnostic points to the conversion process:

1. Add console logs with clear labels:
   ```javascript
   console.log('[DIAG] Component mounted', { props, state });
   ```

2. Log important state changes:
   ```javascript
   useEffect(() => {
     console.log('[DIAG] File state changed', { selectedFile, uploadStatus });
   }, [selectedFile, uploadStatus]);
   ```

3. Add performance measurements:
   ```javascript
   const startTime = performance.now();
   // ... code to measure ...
   console.log(`[PERF] Operation took ${performance.now() - startTime}ms`);
   ```

## Next Steps for Improved Diagnostics

1. **Structured Logging**: Implement structured logging format for easier parsing
2. **Centralized Error Handling**: Create a central error handler to standardize error reporting
3. **Telemetry Integration**: Add optional telemetry to track conversion metrics
4. **Test Automation**: Create automated tests for conversion functionality
5. **Chaos Testing**: Implement intentional failure modes for resilience testing