import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  BASE_URL: string;
  MONGODB_URI: string;
  UPLOADS_DIR: string;
  OUTPUTS_DIR: string;
  TEMP_DIR: string;
  THUMBNAILS_DIR: string;
  MAX_FILE_SIZE: number;
  REDIS_URI: string;
  QUEUE_NAME: string;
  MAX_CONCURRENT_JOBS: number;
  FILE_ENCRYPTION_SECRET: string;
  SECURE_TOKEN_SECRET: string;
  FILE_EXPIRY_FREE: number;
  FILE_EXPIRY_BASIC: number;
  FILE_EXPIRY_PREMIUM: number;
  FILE_EXPIRY_ENTERPRISE: number;
  CLEANUP_INTERVAL: number;
  DOWNLOAD_TOKEN_EXPIRY: number;
  PAYMENT_SERVICE_URL: string;
  INTERNAL_API_KEY: string;
  PAYMENT_REQUIRED: boolean;
  PAYMENT_SECRET_KEY: string;
  PAYMENT_SHOP_ID: string;
  DEFAULT_PAYMENT_CURRENCY: string;
  PDF_TO_DOCX_PRICE: number;
  DOCX_TO_PDF_PRICE: number;
  MOCK_MODE: boolean;
  ENABLE_WEBSOCKETS: boolean;
}

// Default values for environment variables
const env: Environment = {
  NODE_ENV: (process.env.NODE_ENV as Environment['NODE_ENV']) || 'development',
  PORT: parseInt(process.env.PORT || '5001', 10),
  BASE_URL: process.env.BASE_URL || 'http://localhost:5001',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/conversion-service',
  UPLOADS_DIR: process.env.UPLOADS_DIR || 'uploads',
  OUTPUTS_DIR: process.env.OUTPUTS_DIR || 'outputs',
  TEMP_DIR: process.env.TEMP_DIR || 'temp',
  THUMBNAILS_DIR: process.env.THUMBNAILS_DIR || 'thumbnails',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  REDIS_URI: process.env.REDIS_URI || 'redis://localhost:6379',
  QUEUE_NAME: process.env.QUEUE_NAME || 'conversion-queue',
  MAX_CONCURRENT_JOBS: parseInt(process.env.MAX_CONCURRENT_JOBS || '5', 10),
  FILE_ENCRYPTION_SECRET: process.env.FILE_ENCRYPTION_SECRET || 'development-secret-key-for-file-encryption',
  SECURE_TOKEN_SECRET: process.env.SECURE_TOKEN_SECRET || 'development-secret-key-for-secure-tokens',
  FILE_EXPIRY_FREE: parseInt(process.env.FILE_EXPIRY_FREE || '86400000', 10), // 24 hours
  FILE_EXPIRY_BASIC: parseInt(process.env.FILE_EXPIRY_BASIC || '604800000', 10), // 7 days
  FILE_EXPIRY_PREMIUM: parseInt(process.env.FILE_EXPIRY_PREMIUM || '2592000000', 10), // 30 days
  FILE_EXPIRY_ENTERPRISE: parseInt(process.env.FILE_EXPIRY_ENTERPRISE || '7776000000', 10), // 90 days
  CLEANUP_INTERVAL: parseInt(process.env.CLEANUP_INTERVAL || '3600000', 10), // 1 hour
  DOWNLOAD_TOKEN_EXPIRY: parseInt(process.env.DOWNLOAD_TOKEN_EXPIRY || '3600', 10), // 1 hour
  PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5004',
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || 'development-internal-api-key',
  PAYMENT_REQUIRED: process.env.PAYMENT_REQUIRED === 'true' ? true : false,
  PAYMENT_SECRET_KEY: process.env.PAYMENT_SECRET_KEY || 'development-payment-secret',
  PAYMENT_SHOP_ID: process.env.PAYMENT_SHOP_ID || 'dev-shop',
  DEFAULT_PAYMENT_CURRENCY: process.env.DEFAULT_PAYMENT_CURRENCY || 'PLN',
  PDF_TO_DOCX_PRICE: parseFloat(process.env.PDF_TO_DOCX_PRICE || '4.99'),
  DOCX_TO_PDF_PRICE: parseFloat(process.env.DOCX_TO_PDF_PRICE || '4.99'),
  MOCK_MODE: process.env.MOCK_MODE === 'true' ? true : false,
  ENABLE_WEBSOCKETS: process.env.ENABLE_WEBSOCKETS === 'true' ? true : process.env.ENABLE_WEBSOCKETS === 'false' ? false : true,
};

// Validation for required environment variables in production
if (env.NODE_ENV === 'production') {
  const requiredEnvVars = [
    'MONGODB_URI', 
    'REDIS_URI', 
    'FILE_ENCRYPTION_SECRET', 
    'SECURE_TOKEN_SECRET',
    'PAYMENT_SERVICE_URL',
    'INTERNAL_API_KEY',
    'PAYMENT_SECRET_KEY',
    'PAYMENT_SHOP_ID',
    'BASE_URL'
  ];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Environment variable ${envVar} is required in production mode`);
    }
  }

  // Ensure FILE_ENCRYPTION_SECRET is strong enough in production
  if (env.FILE_ENCRYPTION_SECRET.length < 32) {
    throw new Error('FILE_ENCRYPTION_SECRET must be at least 32 characters long in production mode');
  }
  
  // Ensure SECURE_TOKEN_SECRET is strong enough in production
  if (env.SECURE_TOKEN_SECRET.length < 32) {
    throw new Error('SECURE_TOKEN_SECRET must be at least 32 characters long in production mode');
  }
  
  // Ensure PAYMENT_SECRET_KEY is strong enough in production
  if (env.PAYMENT_SECRET_KEY.length < 32) {
    throw new Error('PAYMENT_SECRET_KEY must be at least 32 characters long in production mode');
  }
}

export default env;