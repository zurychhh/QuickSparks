import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Express } from 'express';

export const initSentry = (): void => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express(),
        new ProfilingIntegration(),
      ],
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
    });
  }
};

export const setupSentryRequestHandler = (app: Express): void => {
  if (process.env.NODE_ENV === 'production') {
    app.use(Sentry.Handlers.requestHandler());
  }
};

export const setupSentryErrorHandler = (app: Express): void => {
  if (process.env.NODE_ENV === 'production') {
    app.use(Sentry.Handlers.errorHandler());
  }
};

export const captureException = (error: unknown, context?: Record<string, any>): void => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('Error captured for Sentry:', error, context);
  }
};

export const captureMessage = (message: string, context?: Record<string, any>): void => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(message, { extra: context });
  } else {
    console.info('Message captured for Sentry:', message, context);
  }
};