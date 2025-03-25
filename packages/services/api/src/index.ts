import express from 'express';
import path from 'path';
import fs from 'fs';
import env from './config/env';
import connectDB from './config/database';
import setupSecurityMiddleware from './middleware/security';
import compressionMiddleware from './middleware/compression';
import { globalRateLimit } from './middleware/rateLimit';
import { notFoundHandler, errorHandler } from './utils/errorHandler';
import apiRoutes from './routes';

// Initialize Express app
const app = express();

// Set up security middleware
setupSecurityMiddleware(app);

// Apply compression middleware
app.use(compressionMiddleware);

// Apply global rate limiting
app.use(globalRateLimit);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// API routes
app.use('/api', apiRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start Express server
    app.listen(env.PORT, () => {
      console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  console.error(err.stack);
  // Close server & exit process
  process.exit(1);
});

// Start server
startServer();