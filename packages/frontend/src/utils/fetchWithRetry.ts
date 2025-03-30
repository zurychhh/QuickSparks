import { handleError } from './errorHandler';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  shouldRetry?: (error: any) => boolean;
  context?: string;
  onRetry?: (attempt: number, delay: number, error: any) => void;
}

/**
 * Wrapper for API calls with automatic retry for transient failures
 * 
 * @param fetchFn The async function to execute
 * @param options Configuration options for retries
 * @returns The result of the fetch function
 * @throws The last error encountered if all retries fail
 */
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    shouldRetry = defaultShouldRetry,
    context = 'fetchWithRetry',
    onRetry = () => {},
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      // If this was the last attempt, throw
      if (attempt >= maxRetries - 1) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = calculateBackoffDelay(baseDelay, attempt);
      
      // Log the retry
      console.log(`Retrying request (${attempt + 1}/${maxRetries}) after ${delay}ms due to error: ${error.message || 'Unknown error'}`);
      
      // Notify via callback
      onRetry(attempt + 1, delay, error);

      // Wait before next retry
      await sleep(delay);
    }
  }

  // This should never be reached due to the throw in the loop,
  // but TypeScript needs it for type safety
  throw lastError;
}

/**
 * Default function to determine if an error should be retried
 * Retries on network errors and 5xx server errors
 */
function defaultShouldRetry(error: any): boolean {
  // Network errors (no response)
  if (!error.response) return true;
  
  // Server errors (5xx)
  if (error.response && error.response.status >= 500 && error.response.status < 600) {
    return true;
  }
  
  // Timeout errors
  if (error.code === 'ECONNABORTED') return true;
  
  // Rate limiting (429)
  if (error.response && error.response.status === 429) return true;
  
  return false;
}

/**
 * Calculate backoff delay with jitter
 */
function calculateBackoffDelay(baseDelay: number, attempt: number): number {
  // Exponential backoff: baseDelay * 2^attempt
  const expDelay = baseDelay * Math.pow(2, attempt);
  
  // Add jitter (±20%)
  const jitter = 0.8 + Math.random() * 0.4; 
  
  return Math.floor(expDelay * jitter);
}

/**
 * Simple promise-based sleep function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrapper that combines fetchWithRetry with error handling
 */
export async function fetchWithRetryAndErrorHandling<T>(
  fetchFn: () => Promise<T>,
  context: string,
  options: RetryOptions = {}
): Promise<[T | null, any | null]> {
  try {
    const result = await fetchWithRetry(fetchFn, {
      ...options,
      context
    });
    return [result, null];
  } catch (error) {
    const errorInfo = handleError(error, context);
    return [null, errorInfo];
  }
}

export default {
  fetchWithRetry,
  fetchWithRetryAndErrorHandling
};