import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { captureException } from '@utils/sentry';
import remoteLogger from '../utils/remoteLogger';
import { usePaymentStore } from '../store/subscriptionStore';

// Create environment-aware base URLs
export const API_ENDPOINTS = {
  // Secure endpoints with proper domains
  health: 'https://pdfspark-conversion-service.onrender.com/api/health',
  conversion: 'https://pdfspark-conversion-service.onrender.com/api',
  storage: 'https://pdfspark-conversion-service.onrender.com/api',
  
  // Fallback API endpoints using different server IPs for redundancy
  server1: 'https://18.156.158.53:5000/api',
  server2: 'https://18.156.42.200:5000/api',
  server3: 'https://52.59.103.54:5000/api',
  
  // Proxy endpoint (for Vercel deployment)
  proxy: '/pdfspark/api'
};

// Constants for retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // Base delay of 1 second

// Function to calculate exponential backoff delay
const getRetryDelay = (retryCount: number): number => {
  // Exponential backoff with jitter: 2^n * base_delay + random_jitter
  const exponentialPart = Math.pow(2, retryCount) * RETRY_DELAY_BASE;
  const jitter = Math.random() * 500; // Random jitter of up to 500ms
  return exponentialPart + jitter;
};

// Function to set API error message
const setApiError = (message: string) => {
  if (usePaymentStore) {
    usePaymentStore.getState().setApiError(message);
  } else {
    console.error('API Error:', message);
  }
  
  // Also log to remote logger
  remoteLogger.error(`API Error: ${message}`);
};

// Create API instances for different services
const healthApi = axios.create({
  baseURL: API_ENDPOINTS.health,
  timeout: 10000,
  withCredentials: true
});

const conversionApi = axios.create({
  baseURL: API_ENDPOINTS.conversion,
  timeout: 30000, // Longer timeout for conversion operations
  withCredentials: true
});

const storageApi = axios.create({
  baseURL: API_ENDPOINTS.storage,
  timeout: 15000,
  withCredentials: true
});

// Proxy API instance (for Vercel deployment)
const proxyApi = axios.create({
  baseURL: API_ENDPOINTS.proxy,
  timeout: 20000,
  withCredentials: true
});

// Setup request/response interceptors for each API instance
const setupInterceptors = (apiInstance: AxiosInstance) => {
  // Request interceptor for adding auth token
  apiInstance.interceptors.request.use(
    async (config) => {
      // Add authorization header if user is logged in
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('Request error:', error);
      captureException(error);
      return Promise.reject(error);
    }
  );

  // Response interceptor with retry logic
  apiInstance.interceptors.response.use(
    (response) => {
      console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
      return response;
    },
    async (error) => {
      console.error('API Error:', error.message);
      
      // Original request that failed
      const originalRequest = error.config;
      
      // No response from server (network error) or server errors (5xx)
      const shouldRetry = (
        (!error.response || (error.response && error.response.status >= 500)) && 
        !originalRequest._retry
      );
      
      if (shouldRetry) {
        // Check if we should retry this request
        const retryCount = originalRequest._retryCount || 0;
        if (retryCount < MAX_RETRIES) {
          originalRequest._retryCount = retryCount + 1;
          originalRequest._retry = true;
          
          // Show user-friendly message
          setApiError(`Connection to server failed. Retrying... (${originalRequest._retryCount}/${MAX_RETRIES})`);
          
          // Calculate delay for exponential backoff
          const retryDelay = getRetryDelay(originalRequest._retryCount);
          console.log(`Retrying request after ${retryDelay}ms (attempt ${originalRequest._retryCount}/${MAX_RETRIES})`);
          
          // Wait for the backoff delay
          return new Promise(resolve => {
            setTimeout(() => {
              console.log(`Executing retry ${originalRequest._retryCount}/${MAX_RETRIES}`);
              resolve(apiInstance(originalRequest));
            }, retryDelay);
          });
        } else {
          // Max retries reached - show user-friendly message
          setApiError('Unable to connect to server after multiple attempts. Please check your internet connection or try again later.');
        }
      }
      
      // Handle authentication errors
      if (error.response && error.response.status === 401) {
        // Token expired or invalid, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      // Handle other error responses with appropriate messages
      if (error.response) {
        switch (error.response.status) {
          case 400:
            setApiError("Invalid request. Please check your input.");
            break;
          case 403:
            setApiError("You don't have permission to access this resource.");
            break;
          case 404:
            setApiError("The requested resource was not found.");
            break;
          case 402:
            setApiError("Payment required to access this resource.");
            break;
          case 413:
            setApiError("File too large. Please upload a smaller file.");
            break;
          case 415:
            setApiError("Unsupported file format. Please check supported formats.");
            break;
          case 429:
            setApiError("Too many requests. Please try again later.");
            break;
          case 500:
            setApiError("Server error. Our team has been notified. Please try again later.");
            break;
          default:
            setApiError(`Error: ${error.response.status}`);
        }
      }
      
      // Log error to Sentry
      captureException(error);
      
      return Promise.reject(error);
    }
  );
};

// Apply interceptors to all API instances
[healthApi, conversionApi, storageApi, proxyApi].forEach(setupInterceptors);

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
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  additionalData?: Record<string, any>;
  cancelToken?: any;
}

/**
 * API service with comprehensive error handling and connection management
 */
const apiService = {
  // Health check
  checkHealth: async (): Promise<{
    isHealthy: boolean;
    status?: string;
    services?: Record<string, string>;
    message?: string;
  }> => {
    try {
      // Try main health endpoint first
      const response = await healthApi.get('/health');
      
      if (response.data) {
        return {
          isHealthy: response.data.status === 'operational',
          status: response.data.status,
          services: response.data.services,
          message: 'API is operational'
        };
      }
      return { isHealthy: true };
    } catch (error) {
      console.error('Health check failed:', error);
      
      // Try fallback endpoints
      try {
        // Try proxy endpoint
        const fallbackResponse = await proxyApi.get('/health');
        
        if (fallbackResponse.data) {
          return {
            isHealthy: fallbackResponse.data.status === 'operational',
            status: fallbackResponse.data.status,
            services: fallbackResponse.data.services,
            message: 'API is operational (via proxy)'
          };
        }
        return { isHealthy: true };
      } catch (fallbackError) {
        console.error('All health checks failed:', fallbackError);
        captureException(fallbackError);
        
        return { 
          isHealthy: false,
          status: 'error',
          message: 'Unable to connect to server'
        };
      }
    }
  },
  
  // Upload a file for conversion
  uploadFileForConversion: async ({
    file,
    onProgress,
    onSuccess,
    onError,
    additionalData = {},
    cancelToken
  }: FileUploadOptions): Promise<void> => {
    try {
      // Check API health before starting upload
      const healthStatus = await apiService.checkHealth();
      if (!healthStatus.isHealthy) {
        throw new Error('Conversion service is currently unavailable. Please try again later.');
      }
      
      // Create FormData instance
      const formData = new FormData();
      
      // Append file to form data
      formData.append('file', file);
      
      // Append additional data
      Object.entries(additionalData).forEach(([key, value]) => {
        // Convert values properly for FormData
        if (typeof value === 'boolean' || typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
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
        config.cancelToken = cancelToken;
      }
      
      // Try the conversion API first
      try {
        const response = await conversionApi.post('/conversions/upload', formData, config);
        if (onSuccess) {
          onSuccess(response.data);
        }
      } catch (error) {
        // If the main conversion API fails, try the proxy API
        console.error('Primary conversion API failed, trying proxy:', error);
        
        try {
          const proxyResponse = await proxyApi.post('/conversions/upload', formData, config);
          if (onSuccess) {
            onSuccess(proxyResponse.data);
          }
        } catch (proxyError) {
          // Both APIs failed
          console.error('All conversion APIs failed:', proxyError);
          if (onError) {
            onError(proxyError);
          }
          throw proxyError;
        }
      }
    } catch (error) {
      console.error('File upload failed:', error);
      if (onError) {
        onError(error);
      }
      throw error;
    }
  },
  
  // Get conversion status
  getConversionStatus: async (conversionId: string): Promise<any> => {
    try {
      const response = await conversionApi.get(`/conversions/${conversionId}`);
      
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
      
      return { data: responseData };
    } catch (conversionError) {
      console.error(`Status check failed for conversion: ${conversionId}`, conversionError);
      
      // Try proxy API as fallback
      try {
        const proxyResponse = await proxyApi.get(`/conversions/${conversionId}`);
        
        // Process response same as above
        let responseData = proxyResponse.data;
        
        if (proxyResponse.data && typeof proxyResponse.data === 'object') {
          if (proxyResponse.data.status) {
            responseData = proxyResponse.data;
          } else if (proxyResponse.data.data && proxyResponse.data.data.status) {
            responseData = proxyResponse.data.data;
          }
        }
        
        return { data: responseData };
      } catch (proxyError) {
        console.error(`All status checks failed for conversion: ${conversionId}`, proxyError);
        captureException(proxyError);
        throw proxyError;
      }
    }
  },
  
  // Get download token for a file
  getDownloadToken: async (fileId: string, expiresIn?: number): Promise<any> => {
    try {
      const params: any = {};
      if (expiresIn) {
        params.expiresIn = expiresIn;
      }
      
      // Try storage API first
      const response = await storageApi.get(`/downloads/token/${fileId}`, { params });
      
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
      
      return { data: downloadData };
    } catch (storageError) {
      console.error(`Failed to get download token from storage API for file: ${fileId}`, storageError);
      
      // Try proxy API as fallback
      try {
        const proxyResponse = await proxyApi.get(`/downloads/token/${fileId}`, { 
          params: expiresIn ? { expiresIn } : {} 
        });
        
        // Process response same as above
        let downloadData = proxyResponse.data;
        
        if (proxyResponse.data && proxyResponse.data.data) {
          downloadData = proxyResponse.data.data;
        }
        
        if (!downloadData.downloadUrl && downloadData.url) {
          downloadData.downloadUrl = downloadData.url;
        }
        
        return { data: downloadData };
      } catch (proxyError) {
        console.error(`All download token requests failed for file: ${fileId}`, proxyError);
        
        // Handle payment required error specifically
        if (proxyError.response && proxyError.response.status === 402) {
          return { 
            data: { 
              error: 'Payment required',
              status: 402,
              message: 'Payment is required to download this file',
              paymentRequired: true
            }
          };
        }
        
        captureException(proxyError);
        throw proxyError;
      }
    }
  },
  
  // Create a cancel token
  createCancelToken: () => {
    return axios.CancelToken.source();
  }
};

export default apiService;