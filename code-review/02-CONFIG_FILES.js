/**
 * 02-CONFIG_FILES.js
 * 
 * This file contains key configuration files for the PDFSpark project.
 */

// vercel.json - Vercel deployment configuration with API proxying
// ==========
const vercelConfig = {
  "version": 2,
  "builds": [
    { "src": "packages/frontend/dist/**", "use": "@vercel/static" }
  ],
  "routes": [
    { 
      "src": "/api/(.*)", 
      "dest": "https://pdfspark-api.onrender.com/api/$1",
      "headers": {
        "Access-Control-Allow-Origin": "https://pdfspark.vercel.app",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
        "Access-Control-Allow-Credentials": "true"
      }
    },
    { "src": "/(.*)", "dest": "/packages/frontend/dist/$1" }
  ]
};

// Frontend API Configuration
// ========================
// packages/frontend/src/config/api.config.ts
const apiConfig = `
import { env } from '../utils/env';

/**
 * API configuration that determines base URL based on environment
 */
const config = {
  // Use relative URL in production, absolute URL in development
  baseUrl: env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:3001/api',
  
  endpoints: {
    health: '/health',
    conversion: '/conversion',
    download: '/download',
    thumbnails: '/thumbnails',
    payment: '/payment',
    auth: '/auth'
  },
  
  // Maximum upload file size (10MB)
  maxFileSize: 10 * 1024 * 1024,
  
  // Supported file types
  supportedTypes: {
    pdf: ['application/pdf'],
    docx: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]
  }
};

export default config;
`;

// Backend Environment Configuration
// ===============================
// packages/conversion-service/src/config/env.ts
const envConfig = `
import { z } from 'zod';

// Schema for environment variables validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  MONGODB_URI: z.string(),
  JWT_SECRET: z.string(),
  AWS_BUCKET_NAME: z.string(),
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:5173')
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

export { env };
`;

// Backend CORS Configuration
// =======================
// packages/conversion-service/src/index.ts (excerpt)
const corsConfig = `
// CORS configuration for API requests
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Check against allowed origins
    const allowedOrigins = [
      // Allow frontend in various environments
      env.FRONTEND_URL,
      'http://localhost:5173',  // Vite dev server
      'https://pdfspark.vercel.app',
      // Allow API testing tools
      'https://www.postman.com',
      'https://insomnia.rest'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
`;

// Package.json (root)
// ===============
const packageJson = {
  "name": "pdfspark",
  "version": "1.0.0",
  "description": "PDF and DOCX conversion service",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter \"*\" run dev",
    "build": "pnpm --filter \"*\" run build",
    "test": "pnpm --filter \"*\" run test",
    "lint": "pnpm --filter \"*\" run lint"
  },
  "engines": {
    "node": ">=16.0.0",
    "pnpm": ">=8.0.0"
  },
  "workspaces": [
    "packages/*"
  ]
};