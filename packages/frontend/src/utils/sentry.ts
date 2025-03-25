import * as Sentry from '@sentry/react';

export const initSentry = (): void => {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [],
      tracesSampleRate: 1.0,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION || 'development',
    });
  }
};

export const captureException = (error: unknown, context?: Record<string, any>): void => {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('Error captured for Sentry:', error, context);
  }
};

export const captureMessage = (message: string, context?: Record<string, any>): void => {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, { extra: context });
  } else {
    console.info('Message captured for Sentry:', message, context);
  }
};