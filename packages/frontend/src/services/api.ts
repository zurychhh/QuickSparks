import axios, { AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';
import { captureException } from '@utils/sentry';
import { API_CONFIG, logDebug, normalizeUrlPath } from '../config/api.config';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // For cookies if needed
});

// Store CSRF token in memory (not localStorage)
let csrfToken: string | null = null;

// Function to fetch CSRF token
const fetchCsrfToken = async (): Promise<string> => {
  try {
    // Only fetch a new token if we don't have one
    if (!csrfToken) {
      const response = await api.get('/auth/csrf-token');
      if (response.data?.token) {
        csrfToken = response.data.token;
      }
    }
    return csrfToken || '';
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return '';
  }
};

// Interceptor to handle request
api.interceptors.request.use(
  async (config) => {
    // Log request for debugging
    logDebug(`Sending request to: ${config.url}`, config);
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add CSRF token to mutating requests (except for the CSRF token endpoint itself)
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() || '') &&
      !(config.url?.includes('/auth/csrf-token'))
    ) {
      try {
        const token = await fetchCsrfToken();
        if (token) {
          config.headers['X-CSRF-Token'] = token;
        }
      } catch (tokenError) {
        console.error('Error setting CSRF token:', tokenError);
      }
    }
    
    // Log request payload for debugging
    if (config.data && typeof config.data !== 'string' && !(config.data instanceof FormData)) {
      console.log('Request payload:', config.data);
    }
    
    return config;
  },
  (error) => {
    logDebug('Request error:', error);
    console.error('Request error:', error);
    captureException(error);
    return Promise.reject(error);
  }
);

// Constants for retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // Base delay of 1 second

// Get global store for API error notifications
// We import this way to avoid circular dependencies
let apiErrorStore: any;
try {
  // Dynamically import the store to use for error notifications
  import('../store/subscriptionStore').then(module => {
    apiErrorStore = module.usePaymentStore;
  }).catch(err => {
    console.error('Failed to import API error store:', err);
  });
} catch (e) {
  console.warn('Error store import failed, error notifications may not work');
}

// Function to set API error message
const setApiError = (message: string) => {
  if (apiErrorStore) {
    apiErrorStore.setState({ error: message });
  } else {
    console.error('API Error:', message);
  }
};

// Function to calculate exponential backoff delay
const getRetryDelay = (retryCount: number): number => {
  // Exponential backoff with jitter: 2^n * base_delay + random_jitter
  const exponentialPart = Math.pow(2, retryCount) * RETRY_DELAY_BASE;
  const jitter = Math.random() * 500; // Random jitter of up to 500ms
  return exponentialPart + jitter;
};

// Interceptor to handle response
api.interceptors.response.use(
  (response) => {
    logDebug('Received response:', response);
    console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    
    // Clear any API error messages on successful response
    if (apiErrorStore) {
      apiErrorStore.setState({ error: null });
    }
    
    return response;
  },
  async (error) => {
    logDebug('Response error:', error);
    console.error('API Error:', error.message);
    
    // Original request that failed
    const originalRequest = error.config;
    
    // If no response was received and it's not already being retried
    if (!error.response && !originalRequest._retry) {
      // Check if we should retry this request
      const shouldRetry = !originalRequest._retryCount || originalRequest._retryCount < MAX_RETRIES;
      
      if (shouldRetry) {
        // Increment retry count
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        originalRequest._retry = true;
        
        // Show user-friendly message
        setApiError(`Connection to server failed. Retrying... (${originalRequest._retryCount}/${MAX_RETRIES})`);
        
        // Calculate delay for exponential backoff
        const retryDelay = getRetryDelay(originalRequest._retryCount);
        console.log(`Retrying request after ${retryDelay}ms (attempt ${originalRequest._retryCount}/${MAX_RETRIES})`);
        
        // Use the load balancer to try a different server
        try {
          // Import load balancer utilities
          const { markServerUnhealthy, getNextServer } = await import('../utils/apiLoadBalancer');
          
          // Mark the current server as unhealthy
          if (originalRequest.baseURL) {
            markServerUnhealthy(originalRequest.baseURL);
          }
          
          // Update to use a different server
          originalRequest.baseURL = getNextServer();
        } catch (e) {
          console.error('Failed to update server for retry:', e);
        }
        
        // Wait for the backoff delay
        return new Promise(resolve => {
          setTimeout(() => {
            console.log(`Executing retry ${originalRequest._retryCount}/${MAX_RETRIES}`);
            resolve(api(originalRequest));
          }, retryDelay);
        });
      } else {
        // We've exceeded max retries, show final error
        setApiError('Unable to connect to server after multiple attempts. Please check your internet connection and try again later.');
      }
    }
    
    // Log error to Sentry
    captureException(error);
    
    // Enhanced error handling with more detailed logging
    if (error.response) {
      // Server returned an error response
      const status = error.response.status;
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      const url = error.config?.url || 'unknown-url';
      
      // Log detailed error information
      console.error(`API Error [${status}] for ${method} ${url}:`, error.response.data);
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Request headers:', error.config?.headers);
      
      // Detailed handling for common error codes
      if (status === 401) {
        // No need to remove items from localStorage
        // The server should invalidate the cookie in the response
        // Auth state should be managed centrally in the app
        console.log('Authentication error, redirecting to login page');
        
        // Redirect to login page
        window.location.href = '/login';
      } else if (status === 405) {
        // Method Not Allowed - Log additional debugging information
        console.error('405 Method Not Allowed Error Details:');
        console.error('- Requested URL:', url);
        console.error('- Method Used:', method);
        console.error('- Available Methods:', error.response.headers['allow'] || 'Not specified in response');
        console.error('- Content Type:', error.config?.headers['Content-Type'] || 'Not specified');
        console.error('- Base URL configured:', api.defaults.baseURL);
      } else if (status === 404) {
        // Not Found - Log endpoint information
        console.error('404 Not Found Error Details:');
        console.error('- Requested URL:', url);
        console.error('- Full URL:', error.config?.baseURL ? `${error.config.baseURL}${url}` : url);
      } else if (status === 500) {
        // Server Error - Log server error information
        console.error('500 Server Error Details:');
        console.error('- Error Message:', error.response.data.message || 'No specific error message');
        
        // Consider retrying server errors
        if (!originalRequest._retry && (!originalRequest._retryCount || originalRequest._retryCount < MAX_RETRIES)) {
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          originalRequest._retry = true;
          
          // Different delay strategy for server errors - more delay
          const retryDelay = getRetryDelay(originalRequest._retryCount) * 1.5;
          
          setApiError(`Server error occurred. Retrying... (${originalRequest._retryCount}/${MAX_RETRIES})`);
          
          return new Promise(resolve => {
            setTimeout(() => {
              console.log(`Retrying after server error (attempt ${originalRequest._retryCount}/${MAX_RETRIES})`);
              resolve(api(originalRequest));
            }, retryDelay);
          });
        }
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received');
      console.error('Request URL:', error.config?.url);
      console.error('Request Method:', error.config?.method?.toUpperCase());
      console.error('Request Headers:', error.config?.headers);
    } else {
      // Error in setting up the request
      console.error('Error setup:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Interface for upload progress
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Interface for file upload options
export interface FileUploadOptions {
  file: File;
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (response: AxiosResponse) => void;
  onError?: (error: any) => void;
  additionalData?: Record<string, any>;
  cancelToken?: CancelTokenSource;
}

/**
 * Upload a file with progress tracking
 */
export const uploadFile = ({
  file,
  onProgress,
  onSuccess,
  onError,
  additionalData = {},
  cancelToken,
}: FileUploadOptions): void => {
  // Create FormData instance
  const formData = new FormData();
  
  console.log(`Starting file upload to: ${API_CONFIG.baseUrl}${API_CONFIG.endpoints.convert}`);
  console.log('Form data keys being sent:');
  
  // Append file to form data
  formData.append('file', file);
  console.log('- file');
  
  // Append additional data
  Object.entries(additionalData).forEach(([key, value]) => {
    // Convert values properly for FormData
    if (typeof value === 'boolean' || typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
    console.log(`- ${key}`);
  });
  
  console.log('File details:', {
    name: file.name,
    type: file.type,
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
  });
  
  // Request config with enhanced CORS support
  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    withCredentials: true, // Important for CORS with cookies
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const loaded = progressEvent.loaded;
        const total = progressEvent.total;
        const percentage = Math.round((loaded * 100) / total);
        
        onProgress({ loaded, total, percentage });
        console.log(`Upload progress: ${percentage}%`);
      }
    },
  };
  
  // Add cancel token if provided
  if (cancelToken) {
    config.cancelToken = cancelToken.token;
  }
  
  // Normalize the upload endpoint - use a clean endpoint without double slashes
  // We already have trailing slashes in the endpoints config
  const endpoint = API_CONFIG.endpoints.convert;
  
  // Make request with detailed logging
  logDebug('Uploading file', { 
    fileName: file.name, 
    fileSize: file.size, 
    fileType: file.type,
    endpoint: endpoint,
    baseUrl: API_CONFIG.baseUrl
  });
  
  api.post(endpoint, formData, config)
    .then((response) => {
      logDebug('Upload successful', response.data);
      console.log('File successfully uploaded:', file.name);
      
      // Handle different response structures
      let responseData = response.data;
      
      // If the response is wrapped in a 'data' property, unwrap it
      if (responseData && responseData.data) {
        responseData = {
          ...responseData,
          data: responseData.data
        };
      }
      
      if (onSuccess) {
        onSuccess({
          ...response,
          data: responseData
        });
      }
    })
    .catch((error) => {
      logDebug('Upload failed', error);
      console.error(`File upload failed: ${file.name}`, error.message);
      
      // Add more context to error logging
      if (error.response) {
        console.error('Server responded with error:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server');
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      if (onError) {
        onError(error);
      }
    });
};

/**
 * Get conversion status
 */
export const getConversionStatus = async (conversionId: string): Promise<any> => {
  try {
    // Create endpoint without double slashes
    const endpoint = `${API_CONFIG.endpoints.status}${conversionId}`;
    
    logDebug(`Checking conversion status for: ${conversionId} at endpoint: ${endpoint}`);
    console.log(`Making status request to: ${API_CONFIG.baseUrl}${endpoint}`);
    
    const response = await api.get(endpoint);
    logDebug('Conversion status response:', response.data);
    
    // Handle different response structures
    let responseData = response.data;
    
    // For compatibility with different API formats
    if (response.data && typeof response.data === 'object') {
      // If the data is already properly structured, return it
      if (response.data.status) {
        responseData = response.data;
      } 
      // If the data is wrapped in a data property
      else if (response.data.data && response.data.data.status) {
        responseData = response.data.data;
      }
    }
    
    console.log('Processed status response:', responseData);
    return { data: responseData };
  } catch (error) {
    logDebug(`Status check failed for conversion: ${conversionId}`, error);
    console.error(`Status check error details for ${conversionId}:`, error);
    
    // Add more detailed error logging
    if (error.response) {
      console.error('Server responded with:', error.response.status, error.response.data);
    }
    
    captureException(error);
    throw error;
  }
};

/**
 * ConversionStatusPoller class - Fallback for WebSockets
 * Polls the conversion status endpoint with exponential backoff
 */
export class ConversionStatusPoller {
  private conversionId: string;
  private intervalId: number | null = null;
  private retryCount = 0;
  private maxRetries = 100; // High number for long-running conversions
  private initialInterval = 2000; // 2 seconds
  private onUpdate: (data: any) => void;
  private onError: (error: any) => void;
  private onComplete: (data: any) => void;
  private lastStatus: string | null = null;
  private consecutiveErrors = 0;
  private maxConsecutiveErrors = 5; // After 5 consecutive errors, stop polling
  
  /**
   * Constructor
   */
  constructor(
    conversionId: string,
    onUpdate: (data: any) => void,
    onError: (error: any) => void,
    onComplete: (data: any) => void
  ) {
    this.conversionId = conversionId;
    this.onUpdate = onUpdate;
    this.onError = onError;
    this.onComplete = onComplete;
  }
  
  /**
   * Start polling
   */
  start(): void {
    if (this.intervalId !== null) {
      this.stop(); // Clear existing interval if any
    }
    
    console.log(`Starting status polling for conversion: ${this.conversionId}`);
    
    // Do an immediate check
    this.checkStatus();
    
    // Then set up the interval for subsequent checks
    this.retryCount = 0;
    this.scheduleNextCheck();
  }
  
  /**
   * Stop polling
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
      console.log(`Stopped status polling for conversion: ${this.conversionId}`);
    }
  }
  
  /**
   * Schedule the next status check with exponential backoff
   */
  private scheduleNextCheck(): void {
    if (this.retryCount >= this.maxRetries) {
      console.warn(`Max retries (${this.maxRetries}) reached for conversion: ${this.conversionId}`);
      this.stop();
      return;
    }
    
    // Calculate the next interval using exponential backoff
    // Formula: base * 2^n, capped at 30 seconds
    const nextInterval = Math.min(
      this.initialInterval * Math.pow(1.5, this.retryCount),
      30000 // Maximum 30 seconds
    );
    
    console.log(`Scheduling next status check in ${Math.round(nextInterval / 1000)}s for conversion: ${this.conversionId}`);
    
    this.intervalId = window.setTimeout(() => {
      this.checkStatus();
    }, nextInterval);
    
    this.retryCount++;
  }
  
  /**
   * Check the current status
   */
  private async checkStatus(): Promise<void> {
    try {
      const response = await getConversionStatus(this.conversionId);
      this.consecutiveErrors = 0; // Reset error counter on success
      
      if (response && response.data) {
        const data = response.data;
        
        // Update only if status has changed
        if (this.lastStatus !== data.status) {
          console.log(`Status changed for ${this.conversionId}: ${this.lastStatus} -> ${data.status}`);
          this.lastStatus = data.status;
          this.onUpdate(data);
        }
        
        // Check if conversion is complete
        if (['completed', 'failed', 'error'].includes(data.status)) {
          console.log(`Conversion ${this.conversionId} has reached final status: ${data.status}`);
          this.stop();
          this.onComplete(data);
          return;
        }
        
        // Continue polling for in-progress statuses
        this.scheduleNextCheck();
      } else {
        console.warn(`No data in status response for conversion: ${this.conversionId}`);
        this.scheduleNextCheck();
      }
    } catch (error) {
      this.consecutiveErrors++;
      console.error(`Error checking status (attempt ${this.consecutiveErrors}):`, error);
      
      // Call error handler
      this.onError(error);
      
      // Stop polling if too many consecutive errors
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        console.error(`Too many consecutive errors (${this.consecutiveErrors}), stopping poller for ${this.conversionId}`);
        this.stop();
        return;
      }
      
      // Otherwise continue polling
      this.scheduleNextCheck();
    }
  }
}

/**
 * Get user's conversion history
 */
export const getUserConversions = async (page: number = 1, limit: number = 10, status?: string): Promise<any> => {
  try {
    const params: any = { page, limit };
    if (status) {
      params.status = status;
    }
    
    logDebug('Fetching user conversions', params);
    const response = await api.get(API_CONFIG.endpoints.status, { params });
    logDebug('User conversions response:', response.data);
    return response.data;
  } catch (error) {
    logDebug('Failed to fetch user conversions', error);
    captureException(error);
    throw error;
  }
};

/**
 * Generate thumbnail for a file
 */
export const generateThumbnail = async (fileId: string, options: { page?: number; width?: number } = {}): Promise<any> => {
  try {
    logDebug(`Generating thumbnail for file: ${fileId}`, options);
    const response = await api.post(`${API_CONFIG.endpoints.thumbnails}/generate/${fileId}`, options);
    logDebug('Thumbnail generated successfully', response.data);
    return response.data;
  } catch (error) {
    logDebug(`Failed to generate thumbnail for file: ${fileId}`, error);
    captureException(error);
    throw error;
  }
};

/**
 * Generate thumbnail for a conversion result
 */
export const generateConversionThumbnail = async (conversionId: string, options: { page?: number; width?: number } = {}): Promise<any> => {
  try {
    const response = await api.post(`/thumbnails/conversion/${conversionId}`, options);
    return response.data;
  } catch (error) {
    captureException(error);
    throw error;
  }
};

/**
 * Get download token for a file
 */
export const getDownloadToken = async (fileId: string, expiresIn?: number): Promise<any> => {
  try {
    const params: any = {};
    if (expiresIn) {
      params.expiresIn = expiresIn;
    }
    
    // Create clean endpoint without double slashes
    const endpoint = `${API_CONFIG.endpoints.download}${fileId}`;
    
    logDebug(`Getting download token for file: ${fileId} at endpoint: ${endpoint}`);
    console.log(`Making download token request to: ${API_CONFIG.baseUrl}${endpoint}`);
    
    const response = await api.get(endpoint, { params });
    logDebug('Download token response:', response.data);
    
    // Handle different response structures
    let downloadData = response.data;
    
    // If the response is wrapped in a data property, unwrap it
    if (response.data && response.data.data) {
      downloadData = response.data.data;
    }
    
    // Ensure downloadUrl is available
    if (!downloadData.downloadUrl && downloadData.url) {
      downloadData.downloadUrl = downloadData.url;
    }
    
    console.log('Processed download token:', downloadData);
    return { data: downloadData };
  } catch (error) {
    logDebug(`Failed to get download token for file: ${fileId}`, error);
    console.error(`Download token error details for ${fileId}:`, error);
    
    // Add more detailed error logging
    if (error.response) {
      console.error('Server responded with:', error.response.status, error.response.data);
      
      // Handle payment required error specifically
      if (error.response.status === 402) {
        console.log('Payment required for download - returning controlled error');
        return { 
          data: { 
            error: 'Payment required',
            status: 402,
            message: 'Payment is required to download this file',
            paymentRequired: true
          }
        };
      }
    }
    
    captureException(error);
    throw error;
  }
};

/**
 * Cancel a conversion
 */
export const cancelConversion = async (conversionId: string): Promise<any> => {
  try {
    const response = await api.delete(`/conversions/${conversionId}`);
    return response.data;
  } catch (error) {
    captureException(error);
    throw error;
  }
};

/**
 * Cancel an ongoing upload
 */
export const createCancelToken = (): CancelTokenSource => {
  return axios.CancelToken.source();
};

// Payment API

/**
 * Create a checkout session for one-time payment
 */
export const createPaymentCheckout = async (conversionId: string, successUrl?: string, cancelUrl?: string): Promise<any> => {
  try {
    const response = await api.post('/payments/checkout', {
      conversionId,
      successUrl,
      cancelUrl
    });
    return response.data;
  } catch (error) {
    captureException(error);
    throw error;
  }
};

/**
 * Get payment status for a conversion
 */
export const getPaymentStatus = async (conversionId: string): Promise<any> => {
  try {
    const response = await api.get(`/payments/status/${conversionId}`);
    return response.data;
  } catch (error) {
    captureException(error);
    throw error;
  }
};

/**
 * Get product information (price, etc.)
 */
export const getProductInfo = async (): Promise<any> => {
  try {
    const response = await api.get('/payments/product-info');
    return response.data;
  } catch (error) {
    captureException(error);
    throw error;
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (page: number = 1, limit: number = 10): Promise<any> => {
  try {
    const response = await api.get('/payments/history', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    captureException(error);
    throw error;
  }
};

// Legacy subscription methods - keeping for reference but these won't be used

/**
 * Create a checkout session for subscription (Legacy)
 */
export const createSubscriptionCheckout = async (tier: string, successUrl: string, cancelUrl: string): Promise<any> => {
  try {
    const response = await api.post('/payments/create-checkout', {
      tier,
      successUrl,
      cancelUrl
    });
    return response.data;
  } catch (error) {
    captureException(error);
    throw error;
  }
};

/**
 * Get user subscription information (Legacy)
 */
export const getUserSubscription = async (): Promise<any> => {
  try {
    const response = await api.get('/payments/subscription');
    return response.data;
  } catch (error) {
    captureException(error);
    throw error;
  }
};

/**
 * Cancel user subscription (Legacy)
 */
export const cancelSubscription = async (cancelImmediately: boolean = false): Promise<any> => {
  try {
    const response = await api.post('/payments/cancel-subscription', {
      cancelImmediately
    });
    return response.data;
  } catch (error) {
    captureException(error);
    throw error;
  }
};

/**
 * Create Stripe customer portal session (Legacy)
 */
export const createCustomerPortalSession = async (): Promise<any> => {
  try {
    const response = await api.post('/payments/portal');
    return response.data;
  } catch (error) {
    captureException(error);
    throw error;
  }
};

/**
 * Test CORS configuration
 */
export const testCors = async (): Promise<boolean> => {
  try {
    const response = await api.get(API_CONFIG.endpoints.corsTest);
    console.log('CORS test successful!', response.data);
    return true;
  } catch (error) {
    console.error('CORS test failed:', error);
    return false;
  }
};

/**
 * Check API health status
 * Simple non-authenticated endpoint to verify API connectivity
 */
export const checkApiHealth = async (): Promise<{
  isHealthy: boolean;
  message?: string;
  details?: any;
}> => {
  try {
    const response = await api.get('/health');
    console.log('API health check successful:', response.data);
    return {
      isHealthy: true,
      message: 'API is healthy',
      details: response.data
    };
  } catch (error) {
    console.error('API health check failed:', error);
    
    let errorMessage = 'API health check failed';
    let details = null;
    
    if (error.response) {
      errorMessage = `API returned error status: ${error.response.status}`;
      details = error.response.data;
    } else if (error.request) {
      errorMessage = 'No response received from API';
      details = { requestSent: true, responseReceived: false };
    } else {
      errorMessage = `Error making request: ${error.message}`;
    }
    
    return {
      isHealthy: false,
      message: errorMessage,
      details
    };
  }
};

export default api;