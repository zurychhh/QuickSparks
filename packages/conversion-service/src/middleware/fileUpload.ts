import path from 'path';
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import env from '../config/env';
import logger from '../utils/logger';
import { generateSecureFilename, ensureUserStorageDirectory } from '../utils/fileStorage';

// Define accepted file types
const ACCEPTED_MIME_TYPES = {
  'pdf-to-docx': ['application/pdf'],
  'docx-to-pdf': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
};

// Create multer disk storage
const storage = multer.diskStorage({
  destination: async (req: Request, file: Express.Multer.File, cb) => {
    try {
      // Get user ID from authenticated request
      const userId = req.user?.id;
      
      if (!userId) {
        return cb(new Error('User ID missing or invalid'), '');
      }
      
      // Ensure user directory exists
      const userPath = await ensureUserStorageDirectory(userId, 'uploads');
      
      // Pass directory to multer
      cb(null, userPath);
    } catch (error) {
      logger.error('Error creating upload directory', error);
      cb(new Error('Error preparing upload storage'), '');
    }
  },
  
  filename: (req: Request, file: Express.Multer.File, cb) => {
    try {
      // Generate secure filename
      const secureFilename = generateSecureFilename(file.originalname);
      cb(null, secureFilename);
    } catch (error) {
      logger.error('Error generating secure filename', error);
      cb(new Error('Error processing file'), '');
    }
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Get conversion type from request
  const conversionType = req.body.conversionType || 'pdf-to-docx';
  
  // Get accepted types for this conversion
  const acceptedTypes = ACCEPTED_MIME_TYPES[conversionType as keyof typeof ACCEPTED_MIME_TYPES];
  
  if (!acceptedTypes) {
    return cb(new Error(`Unsupported conversion type: ${conversionType}`));
  }
  
  if (acceptedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(
      `File type not supported. Accepted types for ${conversionType}: ${acceptedTypes.join(', ')}`
    ));
  }
};

// Create multer uploader
const uploader = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
  },
  fileFilter
});

// Middleware to handle file upload
export const fileUploadMiddleware = (fieldName = 'file') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Handle preflight OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      // Return success status - CORS headers are handled by the cors middleware
      return res.status(204).end();
    }
    
    // Set up CORS headers especially for file upload - this reinforces the CORS configuration
    // from the main CORS middleware to ensure it's applied here as well
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Use single file upload
    const upload = uploader.single(fieldName);
    
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === 'LIMIT_FILE_SIZE') {
          logger.warn(`File size limit exceeded: ${err.message}`);
          return res.status(400).json({
            success: false,
            message: `File too large. Max size: ${env.MAX_FILE_SIZE / (1024 * 1024)}MB`
          });
        }
        logger.error('Multer error', err);
        return res.status(400).json({
          success: false,
          message: `File upload error: ${err.message}`
        });
      } else if (err) {
        // Non-Multer error
        logger.error('File upload error:', err);
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      // No file was provided
      if (!req.file) {
        logger.warn('No file provided in upload request');
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      // Log successful file upload
      logger.info(`File uploaded successfully: ${req.file.originalname} (${req.file.size} bytes)`);
      
      // Continue to next middleware
      next();
    });
  };
};

export default fileUploadMiddleware;