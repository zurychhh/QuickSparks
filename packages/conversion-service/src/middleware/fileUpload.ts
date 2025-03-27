import path from 'path';
import fs from 'fs';
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
  logger.info("File upload request:", {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    conversionType: req.body.conversionType
  });
  
  // Get conversion type from request
  const conversionType = req.body.conversionType || 'pdf-to-docx';
  
  // Get accepted types for this conversion
  const acceptedTypes = ACCEPTED_MIME_TYPES[conversionType as keyof typeof ACCEPTED_MIME_TYPES];
  
  if (!acceptedTypes) {
    logger.error(`Unsupported conversion type: ${conversionType}`);
    return cb(new Error(`Unsupported conversion type: ${conversionType}`));
  }

  // Check mimetype first
  if (acceptedTypes.includes(file.mimetype)) {
    logger.info(`File accepted by MIME type: ${file.mimetype}`);
    cb(null, true);
    return;
  }
  
  // If MIME type check fails, check by file extension
  const extension = file.originalname.split('.').pop()?.toLowerCase();
  logger.info(`Checking file extension: ${extension}`);
  
  // Map extensions to conversion types
  const extensionMap: Record<string, string[]> = {
    'pdf': ['pdf-to-docx'],
    'docx': ['docx-to-pdf'],
    'doc': ['docx-to-pdf']
  };
  
  // Check if extension is compatible with the conversion type
  if (extension && extensionMap[extension]?.includes(conversionType)) {
    logger.info(`File accepted by extension: ${extension} for conversion: ${conversionType}`);
    cb(null, true);
    return;
  }
  
  // Reject the file if all checks fail
  logger.error(`File type not supported: ${file.mimetype}, extension: ${extension}`);
  cb(new Error(
    `File type not supported. Accepted types for ${conversionType}: ${acceptedTypes.join(', ')}`
  ));
};

// Create multer uploader
const uploader = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
  },
  fileFilter
});

// Helper middleware to check if uploads directory exists and is writable
export const checkUploadsDirectoryMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploadsDir = path.join(process.cwd(), env.UPLOADS_DIR);
    
    // Check if directory exists
    if (!fs.existsSync(uploadsDir)) {
      logger.error(`Uploads directory does not exist: ${uploadsDir}`);
      try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        logger.info(`Created uploads directory: ${uploadsDir}`);
      } catch (error) {
        logger.error(`Failed to create uploads directory: ${uploadsDir}`, error);
        return res.status(500).json({
          success: false,
          message: 'Server configuration error: Unable to create uploads directory'
        });
      }
    }
    
    // Check if directory is writable
    try {
      const testPath = path.join(uploadsDir, `.write-test-${Date.now()}`);
      fs.writeFileSync(testPath, 'test');
      fs.unlinkSync(testPath);
      logger.info(`Uploads directory is writable: ${uploadsDir}`);
    } catch (error) {
      logger.error(`Uploads directory is not writable: ${uploadsDir}`, error);
      return res.status(500).json({
        success: false, 
        message: 'Server configuration error: Uploads directory is not writable'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Error checking uploads directory', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking upload directory'
    });
  }
};

// Middleware to debug uploaded file
export const fileDebugMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      logger.warn('No file in request after multer processing');
      return next();
    }
    
    logger.info('File processed by multer:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      encoding: req.file.encoding,
      mimetype: req.file.mimetype,
      destination: req.file.destination,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size
    });
    
    // Check if file exists on disk
    if (!fs.existsSync(req.file.path)) {
      logger.error(`File not found on disk: ${req.file.path}`);
      return res.status(500).json({
        success: false,
        message: 'Server error: File saved but not found on disk'
      });
    }
    
    // Check if file size matches expected size
    const stats = fs.statSync(req.file.path);
    logger.info(`File statistics: ${req.file.path}, size: ${stats.size} bytes`);
    
    if (stats.size === 0) {
      logger.error(`Empty file uploaded: ${req.file.path}`);
      return res.status(400).json({
        success: false,
        message: 'Uploaded file is empty'
      });
    }
    
    // File looks good, continue
    next();
  } catch (error) {
    logger.error('Error in file debug middleware', error);
    next(error);
  }
};

// Middleware to handle file upload
export const fileUploadMiddleware = (fieldName = 'file') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // First check uploads directory
    checkUploadsDirectoryMiddleware(req, res, (err) => {
      if (err) return next(err);
      
      // Use single file upload
      const upload = uploader.single(fieldName);
      
      upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          // A Multer error occurred when uploading
          if (err.code === 'LIMIT_FILE_SIZE') {
            logger.warn(`File too large: ${err.field}`, err);
            return res.status(400).json({
              success: false,
              message: `File too large. Maximum size: ${(env.MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB`
            });
          }
          logger.error('Multer error', err);
          return res.status(400).json({
            success: false,
            message: `File upload error: ${err.message}`,
            code: err.code
          });
        } else if (err) {
          // Non-Multer error
          logger.error('File upload error', err);
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }
        
        // No file was provided
        if (!req.file) {
          logger.warn('No file uploaded in request');
          return res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
        }
        
        // Debug file details
        fileDebugMiddleware(req, res, next);
      });
    });
  };
};

export default fileUploadMiddleware;