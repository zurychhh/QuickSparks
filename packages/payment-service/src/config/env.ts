import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  MONGODB_URI: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  API_URL: string;
  FRONTEND_URL: string;
  STRIPE_PRODUCT_ID: string;
  STRIPE_PRICE_ID: string;
}

// Default values for environment variables
const env: Environment = {
  NODE_ENV: (process.env.NODE_ENV as Environment['NODE_ENV']) || 'development',
  PORT: parseInt(process.env.PAYMENT_SERVICE_PORT || '5002', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/payment-service',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_key',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret',
  API_URL: process.env.API_URL || 'http://localhost:5000/api',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  STRIPE_PRODUCT_ID: process.env.STRIPE_PRODUCT_ID || 'prod_default',
  STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID || 'price_default'
};

// Validation for required environment variables in production
if (env.NODE_ENV === 'production') {
  const requiredEnvVars = [
    'MONGODB_URI', 
    'STRIPE_SECRET_KEY', 
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRODUCT_ID',
    'STRIPE_PRICE_ID'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Environment variable ${envVar} is required in production mode`);
    }
  }
}

export default env;