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
  api.post('/conversions/upload', formData, config)
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
 * Get conversion status
 */
export const getConversionStatus = async (conversionId: string): Promise<any> => {
  try {
    const response = await api.get(`/conversions/${conversionId}`);
    return response.data;
  } catch (error) {
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
    
    const response = await api.get('/conversions', { params });
    return response.data;
  } catch (error) {
    captureException(error);
    throw error;
  }
};

/**
 * Generate thumbnail for a file
 */
export const generateThumbnail = async (fileId: string, options: { page?: number; width?: number } = {}): Promise<any> => {
  try {
    const response = await api.post(`/thumbnails/generate/${fileId}`, options);
    return response.data;
  } catch (error) {
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
    
    const response = await api.get(`/downloads/token/${fileId}`, { params });
    return response.data;
  } catch (error) {
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

export default api;