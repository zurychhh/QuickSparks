import React from 'react';
import { usePaymentStore } from '../../store/subscriptionStore';

/**
 * ErrorBanner Component - Displays API and application errors
 * 
 * This component shows user-friendly error messages for API connection issues
 * and other application errors. It's connected to the global error state
 * and automatically appears when an error is present.
 */
const ErrorBanner: React.FC = () => {
  const { error, clearError } = usePaymentStore(state => ({
    error: state.error,
    clearError: state.clearError
  }));
  
  if (!error) return null;
  
  return (
    <div 
      className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" 
      role="alert"
      data-testid="error-banner"
    >
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{error}</span>
      <span 
        className="absolute top-0 bottom-0 right-0 px-4 py-3" 
        onClick={clearError}
        role="button"
        aria-label="Close error message"
      >
        <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <title>Close</title>
          <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
        </svg>
      </span>
    </div>
  );
};

export default ErrorBanner;