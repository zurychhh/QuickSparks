import { useState, useCallback } from 'react';
import { handleError, ErrorInfo, tryCatch } from '../utils/errorHandler';
import { useFeedback } from '../context/FeedbackContext';

interface UseErrorHandlerOptions {
  captureExceptions?: boolean;
  showFeedback?: boolean;
  feedbackDuration?: number;
}

/**
 * Hook for standardized error handling across components
 * Integrates with FeedbackContext for displaying errors to users
 */
export function useErrorHandler(
  context: string,
  options: UseErrorHandlerOptions = {}
) {
  const {
    captureExceptions = true,
    showFeedback = true,
    feedbackDuration = 5000
  } = options;
  
  const [error, setError] = useState<ErrorInfo | null>(null);
  const feedbackContext = useFeedback();
  
  /**
   * Handle an error and optionally display feedback
   */
  const handleErrorWithContext = useCallback((err: unknown, customContext?: string) => {
    const errorInfo = handleError(err, customContext || context, captureExceptions);
    setError(errorInfo);
    
    if (showFeedback && feedbackContext) {
      feedbackContext.showFeedback('error', errorInfo.message, feedbackDuration);
    }
    
    return errorInfo;
  }, [context, captureExceptions, showFeedback, feedbackContext, feedbackDuration]);
  
  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
    if (showFeedback && feedbackContext) {
      feedbackContext.hideFeedback();
    }
  }, [feedbackContext, showFeedback]);
  
  /**
   * Wrapper for async functions to handle errors
   */
  const withErrorHandler = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    customContext?: string
  ): Promise<[T | null, ErrorInfo | null]> => {
    clearError();
    
    try {
      const result = await asyncFn();
      return [result, null];
    } catch (err) {
      const errorInfo = handleErrorWithContext(err, customContext);
      return [null, errorInfo];
    }
  }, [handleErrorWithContext, clearError]);
  
  /**
   * Helper for try-catch pattern
   */
  const runSafe = useCallback(async <T>(
    fn: () => Promise<T>,
    customContext?: string
  ): Promise<[T | null, ErrorInfo | null]> => {
    return tryCatch(fn, customContext || context, captureExceptions);
  }, [context, captureExceptions]);
  
  return {
    error,
    handleError: handleErrorWithContext,
    clearError,
    withErrorHandler,
    runSafe,
    isError: !!error
  };
}

export default useErrorHandler;