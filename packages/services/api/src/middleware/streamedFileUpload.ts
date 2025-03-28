import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { createLogger } from '@utils/logger';
import { ApiError } from '@utils/errorHandler';
import { ensureUserStorageDirectory, generateSecureFilename } from '@utils/fileStorage';
import { StreamedFileStorage } from '@utils/streamedFileStorage';
import { MemoryTracker } from '@utils/memoryMonitor';
import env from '@config/env';

const logger = createLogger('streamedFileUpload');

// Define accepted file types (same as original fileUpload)
const ACCEPTED_MIME_TYPES = {
  'pdf-to-docx': ['application/pdf'],
  'docx-to-pdf': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
};

// Define file size limits
const MAX_FILE_SIZE = parseInt(env.MAX_FILE_SIZE || '10485760', 10); // Default 10MB
const STREAM_THRESHOLD = 5 * 1024 * 1024; // 5MB threshold for streaming

/**
 * File filter function - same as original but made reusable
 */
const validateFileType = (
  mimeType: string,
  conversionType: string = 'pdf-to-docx'
): { valid: boolean; message?: string } => {
  // Get accepted types for this conversion
  const acceptedTypes = ACCEPTED_MIME_TYPES[conversionType as keyof typeof ACCEPTED_MIME_TYPES];
  
  if (!acceptedTypes) {
    return {
      valid: false,
      message: `Unsupported conversion type: ${conversionType}`
    };
  }
  
  if (acceptedTypes.includes(mimeType)) {
    return {
      valid: true
    };
  } else {
    return {
      valid: false,
      message: `File type not supported. Accepted types for ${conversionType}: ${acceptedTypes.join(', ')}`
    };
  }
};

/**
 * Memory storage for small files (below threshold)
 */
const memoryStorage = multer.memoryStorage();

/**
 * Multer disk storage for large files
 */
const diskStorage = multer.diskStorage({
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

/**
 * File filter implementation for multer
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Get conversion type from request
  const conversionType = req.body.conversionType || 'pdf-to-docx';
  
  // Validate the file type
  const validation = validateFileType(file.mimetype, conversionType);
  
  if (validation.valid) {
    cb(null, true);
  } else {
    cb(new ApiError(validation.message || 'Invalid file type', 400));
  }
};

/**
 * Create multer uploader based on request content-length
 * @param req Request object
 * @returns Configured multer instance
 */
const createUploader = (req: Request): multer.Multer => {
  // Get content length from request headers
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  
  // If content length indicates a large file, use disk storage
  if (contentLength > STREAM_THRESHOLD) {
    logger.info(`Large file detected (${contentLength} bytes), using disk storage`);
    return multer({
      storage: diskStorage,
      limits: {
        fileSize: MAX_FILE_SIZE,
      },
      fileFilter
    });
  } else {
    // For smaller files, use memory storage
    logger.info(`Small file detected (${contentLength} bytes), using memory storage`);
    return multer({
      storage: memoryStorage,
      limits: {
        fileSize: MAX_FILE_SIZE,
      },
      fileFilter
    });
  }
};

/**
 * Enhanced middleware that handles both streamed and buffered uploads
 * and encrypts files after upload
 */
export const streamedFileUploadMiddleware = (fieldName = 'file') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Setup memory monitoring
      const memoryTracker = new MemoryTracker('fileUpload-processing');
      memoryTracker.start();
      
      // Create appropriate uploader based on file size
      const uploader = createUploader(req);
      const upload = uploader.single(fieldName);
      
      // Take memory snapshot after setup
      memoryTracker.snapshot('beforeUpload');
      
      // Use multer to handle the file upload
      upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
          // A Multer error occurred when uploading
          memoryTracker.snapshot('multerError').stop();
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ApiError(`File too large. Max size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`, 400));
          }
          logger.error('Multer error', err);
          return next(new ApiError('File upload error: ' + err.message, 400));
        } else if (err) {
          // Non-Multer error or custom ApiError
          memoryTracker.snapshot('otherError').stop();
          return next(err);
        }
        
        // No file was provided
        if (!req.file) {
          memoryTracker.snapshot('noFile').stop();
          return next(new ApiError('No file uploaded', 400));
        }
        
        // Take memory snapshot after successful upload
        memoryTracker.snapshot('afterUpload', req.file.size);
        
        // Process uploaded file
        try {
          const userId = req.user?._id.toString();
          
          if (!userId) {
            memoryTracker.snapshot('noUserId').stop();
            return next(new ApiError('User ID missing or invalid', 401));
          }
          
          // Generate secure storage path
          const secureFilename = generateSecureFilename(req.file.originalname);
          const userPath = await ensureUserStorageDirectory(userId);
          const encryptedPath = path.join(userPath, `${secureFilename}.enc`);
          
          // Store information for subsequent handlers
          const originalFile = { ...req.file };
          
          if (req.file.buffer) {
            // Memory storage - file is in buffer
            logger.info(`Processing buffer-based file: ${req.file.originalname} (${req.file.size} bytes)`);
            
            // Process buffer with StreamedFileStorage
            const encryptionMetadata = await StreamedFileStorage.saveBufferSecurely(
              encryptedPath,
              req.file.buffer,
              userId
            );
            
            // Update file information for subsequent middleware
            req.file.path = encryptedPath;
            
            // Store encryption metadata
            req.file.encryptionMetadata = encryptionMetadata;
          } else {
            // Disk storage - file is saved to disk
            logger.info(`Processing disk-based file: ${req.file.originalname} (${req.file.size} bytes)`);
            
            // Process file with StreamedFileStorage
            const sourcePath = req.file.path;
            const encryptionMetadata = await StreamedFileStorage.saveFileSecurely(
              encryptedPath,
              sourcePath,
              userId
            );
            
            // Delete the original unencrypted file
            await fsPromises.unlink(sourcePath).catch(err => {
              logger.warn(`Failed to delete temporary file ${sourcePath}:`, err);
            });
            
            // Update file information for subsequent middleware
            req.file.path = encryptedPath;
            
            // Store encryption metadata
            req.file.encryptionMetadata = encryptionMetadata;
          }
          
          // Log success
          // Take memory snapshot after encryption completed
          memoryTracker.snapshot('afterEncryption', req.file.size);
          
          // Complete the memory tracking and get the report
          const report = memoryTracker.stop();
          
          // Log memory usage results
          logger.info(`File upload memory usage report: peak=${report.summary.peakMemory.formatted} at ${report.summary.peakMemory.snapshotLabel}, change=${report.summary.memoryIncrease.formatted} (${report.summary.memoryIncrease.percentage.toFixed(2)}%)`);
          
          logger.info(`File uploaded and encrypted successfully: ${req.file.originalname} (${req.file.size} bytes)`);
          
          // Continue to next middleware
          next();
        } catch (error) {
          // Take memory snapshot when error occurs
          memoryTracker.snapshot('processingError').stop();
          
          logger.error('Error processing uploaded file', error);
          return next(new ApiError('Error processing file: ' + (error instanceof Error ? error.message : String(error)), 500));
        }
      });
    } catch (error) {
      logger.error('Unexpected error in file upload middleware', error);
      return next(new ApiError('Unexpected file upload error', 500));
    }
  };
};

/**
 * Enhanced middleware that handles both streamed and buffered uploads
 * and asynchronously processes files after upload
 */
export const validateStreamedFileMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const file = req.file;
  
  if (!file) {
    return next(new ApiError('No file uploaded', 400));
  }
  
  // Additional validation can be added here
  // For example, checking file dimensions for images, validating PDF structure, etc.
  
  // Log successful validation
  logger.info(`File validated successfully: ${file.originalname} (${file.size} bytes)`);
  next();
};