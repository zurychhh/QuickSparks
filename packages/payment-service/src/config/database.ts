import mongoose from 'mongoose';
import env from './env';
import logger from '../utils/logger';

// Connect to MongoDB
const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
};

export default connectDatabase;