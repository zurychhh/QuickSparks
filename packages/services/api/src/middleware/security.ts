import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from '../config/env';

/**
 * Configure security middleware for Express application
 * @param app Express application
 */
function setupSecurityMiddleware(app: express.Application): void {
  // CORS configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );

  // Helmet for setting various HTTP security headers
  app.use(helmet());

  // HTTP request logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  // Parse JSON bodies
  app.use(express.json({ limit: '1mb' }));

  // Parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Set security-related HTTP headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  // Disable Express "X-Powered-By" header
  app.disable('x-powered-by');
}

export default setupSecurityMiddleware;