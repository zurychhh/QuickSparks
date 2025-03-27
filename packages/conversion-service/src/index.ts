import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import env from './config/env';
import connectDatabase from './config/database';
import { initializeWorker } from './config/queue';
import routes from './routes';
import logger from './utils/logger';
import errorHandler from './middleware/errorHandler';
import metrics from './middleware/monitoring/metrics';

// Declare global modules
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        tier: string;
      };
    }
  }
}

// Create Express application
const app = express();

// Apply middleware
// Configure CORS for specific origins
const corsOptions = {
  origin: function(origin, callback) {
    // Lista dozwolonych domen
    const allowedOrigins = [
      'https://pdfspark.vercel.app',            // Main production domain
      'https://www.pdfspark.vercel.app',        // www subdomain
      'https://pdfspark-git-main.vercel.app',   // Branch deployment
      'https://quicksparks.dev',                // Main custom domain
      'https://www.quicksparks.dev',            // www custom domain
      'http://localhost:3000',                  // Local dev with React
      'http://localhost:5173',                  // Local dev with Vite
      env.FRONTEND_URL                          // From env variables
    ].filter(Boolean); // Remove any undefined/empty values
    
    // In development, allow any origin
    if (env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    console.log(`CORS request from origin: ${origin}`);
    
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check if origin ends with allowed domain (subdomains)
    for (const allowed of allowedOrigins) {
      if (origin.endsWith(allowed.replace(/^https?:\/\//, ''))) {
        return callback(null, true);
      }
    }
    
    console.error(`Origin blocked by CORS: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Content-Disposition', 'X-CSRF-Token'],
  exposedHeaders: ['Content-Disposition'], // Expose headers for file downloads
  credentials: true,
  maxAge: 86400,  // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser(env.COOKIE_SECRET || 'pdfspark-default-cookie-secret-replace-in-production'));

// Add metrics middleware for all requests
app.use(metrics.httpMetricsMiddleware);

// Create required directories if they don't exist
const uploadsDir = path.join(process.cwd(), env.UPLOADS_DIR);
const outputsDir = path.join(process.cwd(), env.OUTPUTS_DIR);

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info(`Created uploads directory at ${uploadsDir}`);
}

if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
  logger.info(`Created outputs directory at ${outputsDir}`);
}

// Metrics endpoint for Prometheus scraping - no authentication required
// but should be protected by network policies in production
app.get('/metrics', metrics.metricsHandler);

// Apply API routes
app.use('/api', routes);

// Add request ID middleware
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.headers['x-request-id'] = requestId as string;
  res.setHeader('X-Request-ID', requestId as string);
  next();
});

// Add security headers to all responses
app.use((req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Set strict content security policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none';");
  
  // Set referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});

// Apply not found handler for undefined routes - must come after all valid routes
app.use(errorHandler.notFoundHandler);

// Global error handler - must be the last middleware
app.use(errorHandler.errorHandler);

// Initialize worker
let worker: any;

// Start the server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Initialize queue worker
    worker = initializeWorker();
    logger.info('Queue worker initialized');
    
    // Start HTTP server
    app.listen(env.PORT, () => {
      logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  if (worker) {
    await worker.close();
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  if (worker) {
    await worker.close();
  }
  
  process.exit(0);
});

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled rejection', reason);
});

// Start the server
startServer();