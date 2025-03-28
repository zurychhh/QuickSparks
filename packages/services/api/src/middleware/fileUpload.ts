import path from 'path';
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import env from '@config/env';
import { ApiError } from '@utils/errorHandler';
import { ensureUserStorageDirectory, generateSecureFilename } from '@utils/fileStorage';
import { createLogger } from '@utils/logger';

const logger = createLogger('fileUpload');

// Define accepted file types
const ACCEPTED_MIME_TYPES = {
  'pdf-to-docx': ['application/pdf'],
  'docx-to-pdf': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
};

// Define file size limits
const MAX_FILE_SIZE = parseInt(env.MAX_FILE_SIZE || '10485760', 10); // Default 10MB

// Create multer disk storage
const storage = multer.diskStorage({
  destination: async (req: Request, file: Express.Multer.File, cb) => {
    try {
      // Get user ID from authenticated request
      const userId = req.user?._id.toString();
      
      if (!userId) {
        return cb(new ApiError('User ID missing or invalid', 401), '');
      }
      
      // Ensure user directory exists
      const userPath = await ensureUserStorageDirectory(userId);
      
      // Pass directory to multer
      cb(null, userPath);
    } catch (error) {
      logger.error('Error creating upload directory', error);
      cb(new ApiError('Error preparing upload storage', 500), '');
    }
  },
  
  filename: (req: Request, file: Express.Multer.File, cb) => {
    try {
      // Generate secure filename
      const secureFilename = generateSecureFilename(file.originalname);
      cb(null, secureFilename);
    } catch (error) {
      logger.error('Error generating secure filename', error);
      cb(new ApiError('Error processing file', 500), '');
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
    return cb(new ApiError(`Unsupported conversion type: ${conversionType}`, 400));
  }
  
  if (acceptedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(
      `File type not supported. Accepted types for ${conversionType}: ${acceptedTypes.join(', ')}`,
      400
    ));
  }
};

// Create multer uploader
const uploader = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter
});

// Middleware to handle file upload
export const fileUploadMiddleware = (fieldName = 'file') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Use single file upload
    const upload = uploader.single(fieldName);
    
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApiError(`File too large. Max size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`, 400));
        }
        logger.error('Multer error', err);
        return next(new ApiError('File upload error: ' + err.message, 400));
      } else if (err) {
        // Non-Multer error or custom ApiError
        return next(err);
      }
      
      // No file was provided
      if (!req.file) {
        return next(new ApiError('No file uploaded', 400));
      }
      
      // Continue to next middleware
      next();
    });
  };
};

// Middleware to validate file characteristics after upload
export const validateFileMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const file = req.file;
  
  if (!file) {
    return next(new ApiError('No file uploaded', 400));
  }
  
  // Additional validation can be added here
  // For example, checking file dimensions for images, validating PDF structure, etc.
  
  // For now, just log and continue
  logger.info(`File validated successfully: ${file.originalname} (${file.size} bytes)`);
  next();
};