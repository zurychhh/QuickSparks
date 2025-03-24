/**
 * Default configuration for QuickSparks services
 * 
 * This file contains configuration defaults that can be overridden by environment variables.
 * Sensitive information like API keys should NEVER be stored here - use environment variables instead.
 */

module.exports = {
  // Server configurations
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    cors: {
      enabled: true,
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },

  // Logging
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? 'json' : 'pretty',
    serviceName: 'quicksparks', // Override in service-specific configs
  },

  // File storage
  storage: {
    tempDir: process.env.TEMP_DIR || './temp',
    uploadLimits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
      files: parseInt(process.env.MAX_FILES || '5', 10),
    },
    retentionPeriod: 60 * 60 * 24, // 24 hours in seconds
  },

  // Database - Minimal default, should be overridden by service-specific configs
  database: {
    type: process.env.DB_TYPE || 'mongodb',
    url: process.env.DB_URL || 'mongodb://localhost:27017/quicksparks',
  },

  // Service URLs
  services: {
    gateway: process.env.GATEWAY_URL || 'http://localhost:3000',
    pdf: process.env.PDF_SERVICE_URL || 'http://localhost:3001',
    image: process.env.IMAGE_SERVICE_URL || 'http://localhost:3002',
    qr: process.env.QR_SERVICE_URL || 'http://localhost:3003',
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3004',
  },

  // Conversion settings - Default limits and options
  conversion: {
    timeout: parseInt(process.env.CONVERSION_TIMEOUT || '300000', 10), // 5 minutes
    concurrency: parseInt(process.env.CONVERSION_CONCURRENCY || '2', 10),
    retries: parseInt(process.env.CONVERSION_RETRIES || '3', 10),
  },

  // Security settings
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-DO-NOT-USE-IN-PRODUCTION',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    bcryptRounds: 10,
  },
};