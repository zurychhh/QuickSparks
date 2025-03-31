import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { captureException } from '@utils/sentry';
import remoteLogger from '../utils/remoteLogger';
import { usePaymentStore } from '../store/subscriptionStore';

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

// Create API instance using relative paths that work with Vercel proxy
const api = axios.create({
  baseURL: '/api', // This will work with our Vercel proxy rewrites
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Setup request/response interceptors
// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Log request for debugging
    console.log(`API Request via proxy: ${config.method?.toUpperCase()} ${config.url}`);
    remoteLogger.info(`API Request via proxy: ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    captureException(error);
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
api.interceptors.response.use(
  (response) => {
    console.log(`API Response via proxy: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    remoteLogger.info(`API Response via proxy: ${response.status}`, {
      url: response.config.url,
      method: response.config.method?.toUpperCase()
    });
    
    return response;
  },
  async (error) => {
    console.error('API Error via proxy:', error.message);
    remoteLogger.error('API Error via proxy', {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method
    });
    
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
            resolve(api(originalRequest));
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
 * API service that uses Vercel's proxy to avoid CORS and mixed content issues
 */
const proxyApiService = {
  // Check API health
  checkHealth: async (): Promise<{
    isHealthy: boolean;
    status?: string;
    services?: Record<string, string>;
    message?: string;
  }> => {
    try {
      const response = await api.get('/health');
      
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
      remoteLogger.error('Health check failed', error);
      
      return { 
        isHealthy: false,
        status: 'error',
        message: 'Unable to connect to server'
      };
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
      
      // Request config
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
      
      // Use the /conversions/upload endpoint via our proxy
      const response = await api.post('/conversions/upload', formData, config);
      
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error('File upload failed:', error);
      remoteLogger.error('File upload failed', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        error: error
      });
      
      if (onError) {
        onError(error);
      }
      throw error;
    }
  },
  
  // Get conversion status
  getConversionStatus: async (conversionId: string): Promise<any> => {
    try {
      const response = await api.get(`/conversions/${conversionId}`);
      
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
    } catch (error) {
      console.error(`Status check failed for conversion: ${conversionId}`, error);
      remoteLogger.error('Status check failed', {
        conversionId: conversionId,
        error: error
      });
      
      throw error;
    }
  },
  
  // Get download token for a file
  getDownloadToken: async (fileId: string, expiresIn?: number): Promise<any> => {
    try {
      const params: any = {};
      if (expiresIn) {
        params.expiresIn = expiresIn;
      }
      
      const response = await api.get(`/downloads/token/${fileId}`, { params });
      
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
    } catch (error) {
      console.error(`Failed to get download token for file: ${fileId}`, error);
      remoteLogger.error('Download token error', {
        fileId: fileId,
        error: error
      });
      
      // Handle payment required error specifically
      if (error.response && error.response.status === 402) {
        return { 
          data: { 
            error: 'Payment required',
            status: 402,
            message: 'Payment is required to download this file',
            paymentRequired: true
          }
        };
      }
      
      throw error;
    }
  },
  
  // Create a cancel token
  createCancelToken: () => {
    return axios.CancelToken.source();
  }
};

export default proxyApiService;