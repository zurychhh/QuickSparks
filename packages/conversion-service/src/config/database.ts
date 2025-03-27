import mongoose from 'mongoose';
import env from './env';
import logger from '../utils/logger';

// Options for MongoDB connection
const options = {
  autoIndex: true,
  autoCreate: true
};

/**
 * Connect to MongoDB
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI, options);
    
    logger.info('MongoDB connection established successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to application termination');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDatabase;