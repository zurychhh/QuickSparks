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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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