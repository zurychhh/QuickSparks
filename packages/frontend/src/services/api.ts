import axios, { AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';
import { captureException } from '@utils/sentry';

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to handle request
api.interceptors.request.use(
  (config) => {
    // Get token from local storage
    const token = localStorage.getItem('authToken');
    
    // If token exists, add it to the request header
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    captureException(error);
    return Promise.reject(error);
  }
);

// Interceptor to handle response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error to Sentry
    captureException(error);
    
    // Handle 401 Unauthorized
    if (error.response && error.response.status === 401) {
      // Clear authentication data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Redirect to login page
      window.location.href = '/login';
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
  
  // Append file to form data
  formData.append('file', file);
  
  // Append additional data
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
  });
  
  // Request config
  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const loaded = progressEvent.loaded;
        const total = progressEvent.total;
        const percentage = Math.round((loaded * 100) / total);
        
        onProgress({ loaded, total, percentage });
      }
    },
  };
  
  // Add cancel token if provided
  if (cancelToken) {
    config.cancelToken = cancelToken.token;
  }
  
  // Make request
  api.post('/convert/upload', formData, config)
    .then((response) => {
      if (onSuccess) {
        onSuccess(response);
      }
    })
    .catch((error) => {
      if (onError) {
        onError(error);
      }
    });
};

/**
 * Cancel an ongoing upload
 */
export const createCancelToken = (): CancelTokenSource => {
  return axios.CancelToken.source();
};

export default api;