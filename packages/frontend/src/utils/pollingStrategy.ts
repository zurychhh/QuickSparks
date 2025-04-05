/**
 * Configuration for polling with exponential backoff
 */
export interface PollingConfig {
  initialDelay: number;  // Initial polling delay in milliseconds
  maxDelay: number;      // Maximum polling delay in milliseconds
  backoffFactor: number; // Multiplier for exponential backoff (e.g., 1.5)
  maxAttempts?: number;  // Maximum number of polling attempts (optional)
  minDelay?: number;     // Minimum polling delay after backoff (optional)
}

/**
 * Creates a polling strategy with exponential backoff
 * 
 * @param config Polling configuration
 * @returns Object with polling functions
 */
export const createPollingStrategy = (config: PollingConfig) => {
  const {
    initialDelay,
    maxDelay,
    backoffFactor,
    maxAttempts = Infinity,
    minDelay = initialDelay
  } = config;
  
  let currentDelay = initialDelay;
  let attempts = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  
  /**
   * Schedules the next polling call with current delay
   * @param callback Function to call when timer expires
   * @returns The timeout ID
   */
  const scheduleNext = (callback: () => void): NodeJS.Timeout => {
    attempts++;
    const timerId = setTimeout(() => {
      callback();
      // Increase delay with exponential backoff
      currentDelay = Math.min(currentDelay * backoffFactor, maxDelay);
      // Ensure we don't go below minimum delay (useful for jitter strategies)
      currentDelay = Math.max(currentDelay, minDelay);
    }, currentDelay);
    
    timeoutId = timerId;
    return timerId;
  };
  
  /**
   * Cancels any pending polling timeout
   */
  const cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  /**
   * Resets the polling strategy to initial state
   */
  const reset = (): void => {
    cancel();
    currentDelay = initialDelay;
    attempts = 0;
  };
  
  /**
   * Checks if we've reached maximum attempts
   * @returns True if maximum attempts reached, false otherwise
   */
  const hasReachedMaxAttempts = (): boolean => {
    return attempts >= maxAttempts;
  };
  
  /**
   * Gets current polling state
   */
  const getState = () => ({
    currentDelay,
    attempts,
    maxAttempts,
    hasActiveTimeout: timeoutId !== null
  });
  
  return {
    scheduleNext,
    cancel,
    reset,
    hasReachedMaxAttempts,
    getState
  };
};

export default createPollingStrategy;