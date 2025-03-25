import mongoose from 'mongoose';
import env from './env';

/**
 * Database connection options
 */
const dbOptions: mongoose.ConnectOptions = {
  maxPoolSize: 10, // Maximum number of connections in the pool
  minPoolSize: 2, // Minimum number of connections in the pool
};

/**
 * Connect to MongoDB database
 */
async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, dbOptions);
    console.log('MongoDB connected successfully');
    
    // Handle MongoDB connection events
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
    
    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
}

export default connectDB;