/**
 * 13-BACKEND_MIDDLEWARE.js
 * 
 * This file contains backend middleware components.
 */

// Authentication Middleware
// =====================
// packages/conversion-service/src/middleware/auth.ts
const authMiddleware = `
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role?: string;
      };
    }
  }
}

/**
 * Authentication middleware to validate JWT tokens
 */
export const authenticate = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: string;
        email: string;
        role?: string;
      };
      
      // Attach user info to request
      req.user = decoded;
      
      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but does not require it
 */
export const optionalAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Continue without authentication
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      // Continue without authentication
      return next();
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: string;
        email: string;
        role?: string;
      };
      
      // Attach user info to request
      req.user = decoded;
    } catch (error) {
      // Invalid token, but continue without authentication
      logger.warn('Invalid token, continuing as anonymous:', error);
    }
    
    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    return next();
  }
};

/**
 * Admin role authorization middleware
 */
export const requireAdmin = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // First, ensure user is authenticated
  authenticate(req, res, () => {
    // Check if user has admin role
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
  });
};
`;

// File Upload Middleware
// =================
// packages/conversion-service/src/middleware/fileUpload.ts
const fileUploadMiddleware = `
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create user-specific directory if authenticated
    let uploadPath = uploadsDir;
    
    if (req.user && req.user.id) {
      const userDir = path.join(uploadsDir, req.user.id);
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }
      uploadPath = userDir;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const fileName = uniqueId + fileExtension;
    
    cb(null, fileName);
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow PDF and DOCX files
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(\`Unsupported file type: \${file.mimetype}. Only PDF and DOCX files are allowed.\`));
  }
};

// Create multer instance
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

/**
 * Custom error handler for multer
 */
export const handleFileUploadErrors = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    // Handle multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 50MB.'
      });
    }
    
    return res.status(400).json({
      message: \`File upload error: \${err.message}\`
    });
  } else if (err) {
    // Handle other errors
    logger.error('File upload error:', err);
    return res.status(400).json({
      message: err.message || 'File upload failed'
    });
  }
  
  next();
};
`;

// Error Handler Middleware
// ===================
// packages/conversion-service/src/middleware/errorHandler.ts
const errorHandlerMiddleware = `
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Central error handling middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Prepare error response
  const errorResponse = {
    error: true,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  };
  
  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Not found (404) middleware
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new Error(\`Route not found: \${req.originalUrl}\`);
  res.status(404);
  next(error);
};

/**
 * Async handler to wrap async route handlers
 * This eliminates the need for try/catch blocks in route handlers
 */
export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
`;

// Request Validation Middleware
// ========================
// A simplified schema validation middleware
const validationMiddleware = `
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';

/**
 * Middleware factory for request validation using Zod schemas
 */
export const validateRequest = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Combine request body, query, and params
      const data = {
        body: req.body,
        query: req.query,
        params: req.params,
      };
      
      // Validate data against schema
      const validatedData = schema.parse(data);
      
      // Update request objects with validated data
      req.body = validatedData.body;
      req.query = validatedData.query;
      req.params = validatedData.params;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format validation errors
        const validationErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        
        logger.warn('Validation error:', validationErrors);
        
        return res.status(400).json({
          error: 'Validation Error',
          details: validationErrors,
        });
      }
      
      // Handle other errors
      next(error);
    }
  };
};

/**
 * Example schema for the conversion endpoint
 */
export const conversionSchema = z.object({
  body: z.object({
    conversionType: z.enum(['pdf-to-docx', 'docx-to-pdf']),
    quality: z.enum(['low', 'medium', 'high']).optional().default('high'),
    preserveImages: z.boolean().optional().default(true),
    preserveFormatting: z.boolean().optional().default(true),
  }),
  params: z.object({}),
  query: z.object({}),
});

/**
 * Example schema for the payment webhook
 */
export const paymentWebhookSchema = z.object({
  body: z.any(), // Raw Stripe webhook body
  params: z.object({}),
  query: z.object({}),
});
`;