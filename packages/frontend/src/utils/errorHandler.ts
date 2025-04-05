import { captureException } from './sentry';

export interface ErrorInfo {
  message: string;
  code?: string;
  statusCode?: number;
  originalError?: unknown;
}

export class AppError extends Error {
  code: string;
  statusCode?: number;
  originalError?: unknown;

  constructor(errorInfo: ErrorInfo) {
    super(errorInfo.message);
    this.name = 'AppError';
    this.code = errorInfo.code || 'UNKNOWN_ERROR';
    this.statusCode = errorInfo.statusCode;
    this.originalError = errorInfo.originalError;
  }
}

/**
 * Parse API error responses to extract useful information
 */
export function parseApiError(error: unknown): ErrorInfo {
  // Default error information
  const defaultErrorInfo: ErrorInfo = {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  };

  // If the error is null or undefined, return default error
  if (!error) {
    return defaultErrorInfo;
  }

  try {
    // If it's already an AppError, just return its info
    if (error instanceof AppError) {
      return {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        originalError: error.originalError
      };
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      return {
        message: error.message || defaultErrorInfo.message,
        code: 'ERROR',
        originalError: error
      };
    }

    // Handle Axios errors or similar API errors with response object
    if (
      typeof error === 'object' && 
      error !== null && 
      'response' in error && 
      error.response && 
      typeof error.response === 'object'
    ) {
      const response = error.response as any;
      
      // Get status code
      const statusCode = response.status || undefined;
      
      // Handle 401 unauthorized
      if (statusCode === 401) {
        return {
          message: 'Authentication required. Please log in and try again.',
          code: 'UNAUTHORIZED',
          statusCode: 401,
          originalError: error
        };
      }
      
      // Handle 402 payment required
      if (statusCode === 402) {
        return {
          message: 'Payment required to access this resource.',
          code: 'PAYMENT_REQUIRED',
          statusCode: 402,
          originalError: error
        };
      }
      
      // Handle 403 forbidden
      if (statusCode === 403) {
        return {
          message: 'You do not have permission to access this resource.',
          code: 'FORBIDDEN',
          statusCode: 403,
          originalError: error
        };
      }
      
      // Handle 404 not found
      if (statusCode === 404) {
        return {
          message: 'The requested resource was not found.',
          code: 'NOT_FOUND',
          statusCode: 404,
          originalError: error
        };
      }
      
      // Handle 429 too many requests
      if (statusCode === 429) {
        return {
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          originalError: error
        };
      }
      
      // Try to extract message from response data
      let apiMessage = 'Server error';
      if (response.data) {
        if (typeof response.data === 'string') {
          apiMessage = response.data;
        } else if (typeof response.data === 'object') {
          apiMessage = response.data.message || response.data.error || JSON.stringify(response.data);
        }
      }
      
      return {
        message: apiMessage,
        code: response.data?.code || `HTTP_${statusCode}`,
        statusCode,
        originalError: error
      };
    }
    
    // Try to stringify object errors
    if (typeof error === 'object' && error !== null) {
      return {
        message: (error as any).message || JSON.stringify(error),
        code: (error as any).code || 'OBJECT_ERROR',
        originalError: error
      };
    }

    // Handle primitive error types
    if (typeof error === 'string') {
      return {
        message: error,
        code: 'STRING_ERROR',
        originalError: error
      };
    }

    // Fallback for any other type
    return {
      message: String(error),
      code: 'UNKNOWN_ERROR',
      originalError: error
    };
  } catch (parseError) {
    console.error('Error parsing error:', parseError);
    return defaultErrorInfo;
  }
}

/**
 * Unified error handler that:
 * 1. Parses the error to extract useful information
 * 2. Logs the error appropriately
 * 3. Captures the error for monitoring (optional)
 * 4. Returns standardized error information
 */
export function handleError(
  error: unknown, 
  context: string = '', 
  shouldCapture: boolean = true
): ErrorInfo {
  // Parse the error
  const errorInfo = parseApiError(error);
  
  // Log the error with context
  console.error(`[${context}]`, errorInfo.message, errorInfo);
  
  // Capture exception for monitoring if requested
  if (shouldCapture) {
    captureException(
      errorInfo.originalError || new AppError(errorInfo), 
      { 
        tags: { context },
        extra: { 
          errorInfo,
          parsedError: true 
        } 
      }
    );
  }
  
  return errorInfo;
}

/**
 * Helper function to handle errors in async functions with consistent error handling
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  context: string = '',
  shouldCapture: boolean = true
): Promise<[T | null, ErrorInfo | null]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    const errorInfo = handleError(error, context, shouldCapture);
    return [null, errorInfo];
  }
}

export default {
  handleError,
  parseApiError,
  tryCatch,
  AppError
};