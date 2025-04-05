import api from '../services/api';
import { captureException } from './sentry';
import { API_CONFIG } from '../config/api.config';

/**
 * HealthCheckResult interface
 */
export interface HealthCheckResult {
  isHealthy: boolean;
  services?: Record<string, string>;
  message?: string;
  details?: any;
}

/**
 * Check API health
 * 
 * This utility checks if the API is operational by calling the /health endpoint.
 * It returns a detailed health status that can be used to display appropriate
 * messages to the user or trigger fallback mechanisms.
 */
export const checkApiHealth = async (): Promise<HealthCheckResult> => {
  try {
    console.log(`Checking API health at: ${API_CONFIG.baseUrl}${API_CONFIG.endpoints.health}`);
    const response = await api.get(API_CONFIG.endpoints.health);
    
    if (response.data && response.status === 200) {
      return {
        isHealthy: response.data.status === 'operational',
        services: response.data.services,
        message: 'API is healthy',
        details: response.data
      };
    }
    
    // If we get a response but it doesn't indicate operational status
    return {
      isHealthy: false,
      message: 'API is degraded or has unknown status',
      details: response.data
    };
  } catch (error) {
    console.error('API health check failed:', error);
    captureException(error);
    
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

/**
 * Perform a health check before a critical operation
 * 
 * This higher-order function wraps an async operation with a health check.
 * If the API is healthy, it proceeds with the operation. Otherwise, it returns
 * a failure result without attempting the operation.
 * 
 * @param operation The async operation to perform if the API is healthy
 * @param errorHandler Optional custom error handler for health check failures
 */
export const withHealthCheck = <T>(
  operation: () => Promise<T>,
  errorHandler?: (result: HealthCheckResult) => void
): Promise<T | null> => {
  return checkApiHealth().then((healthResult) => {
    if (healthResult.isHealthy) {
      return operation();
    } else {
      console.error('API health check failed before operation:', healthResult);
      
      if (errorHandler) {
        errorHandler(healthResult);
      }
      
      return Promise.resolve(null);
    }
  });
};

// Health check utils for use throughout the application
export default {
  checkApiHealth,
  withHealthCheck
};