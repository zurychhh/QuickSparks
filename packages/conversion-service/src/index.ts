import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import env from './config/env';
import connectDatabase from './config/database';
import { initializeWorker } from './config/queue';
import routes from './routes';
import logger from './utils/logger';

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
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    console.log("CORS request from origin:", origin);
    
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      console.log("Accepting request with no origin");
      return callback(null, true);
    }
    
    // List of allowed origins
    const allowedOrigins = [
      env.FRONTEND_URL,                   // Environment variable frontend URL
      'https://pdfspark.vercel.app',      // Main production domain
      'https://pdfspark-git-main.vercel.app', // Branch deployment
      'http://localhost:3000',            // React local development
      'http://localhost:5173',            // Vite local development
      'http://127.0.0.1:5173',            // Vite local IP
      'http://localhost:8080'             // Webpack local development
    ];
    
    console.log("Allowed origins:", allowedOrigins);
    console.log("FRONTEND_URL from env:", env.FRONTEND_URL);
    
    // In development mode, accept all origins
    if (env.NODE_ENV === 'development') {
      console.log("Development mode: accepting all origins");
      callback(null, true);
      return;
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log("Origin allowed:", origin);
      callback(null, true);
    } else {
      console.error("Origin rejected:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400  // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// Apply routes
app.use('/api', routes);

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', err);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: env.NODE_ENV === 'development' ? err.message : undefined
  });
});

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