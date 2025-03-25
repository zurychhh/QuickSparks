import express from 'express';
import cors from 'cors';
import env from './config/env';
import connectDatabase from './config/database';
import routes from './routes';
import logger from './utils/logger';

// Create Express application
const app = express();

// Apply middleware - Note: webhook routes are handled separately
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Start the server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start HTTP server
    app.listen(env.PORT, () => {
      logger.info(`Payment service running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
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