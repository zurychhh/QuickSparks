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

// Interceptor to handle request
api.interceptors.request.use(
  (config) => {
    // Log request for debugging
    logDebug(`Sending request to: ${config.url}`, config);
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Get token from local storage
    const token = localStorage.getItem('authToken');
    
    // If token exists, add it to the request header
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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

// Interceptor to handle response
api.interceptors.response.use(
  (response) => {
    logDebug('Received response:', response);
    console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    logDebug('Response error:', error);
    console.error('API Error:', error.message);
    
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
        // Clear authentication data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
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
  
  // Request config
  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
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

export default api;