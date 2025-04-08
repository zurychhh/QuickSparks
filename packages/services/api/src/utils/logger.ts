import * as Sentry from '@sentry/node';

// Simple logger that also sends to Sentry for critical events
export interface Logger {
  debug: (message: string, meta?: any) => void;
  info: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  error: (message: string, error?: any) => void;
}

export const createLogger = (context: string): Logger => {
  return {
    debug: (message: string, meta?: any) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[${context}] ${message}`, meta || '');
      }
    },
    
    info: (message: string, meta?: any) => {
      console.info(`[${context}] ${message}`, meta || '');
    },
    
    warn: (message: string, meta?: any) => {
      console.warn(`[${context}] ${message}`, meta || '');
      
      // Also capture in Sentry as breadcrumb
      Sentry.addBreadcrumb({
        category: context,
        message,
        level: 'warning',
        data: meta
      });
    },
    
    error: (message: string, error?: any) => {
      console.error(`[${context}] ${message}`, error || '');
      
      // Capture in Sentry
      Sentry.captureException(error, {
        extra: {
          context,
          message
        }
      });
    }
  };
};