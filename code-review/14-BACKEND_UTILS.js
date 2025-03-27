/**
 * 14-BACKEND_UTILS.js
 * 
 * This file contains backend utility functions.
 */

// Secure Links Utility
// ================
// packages/conversion-service/src/utils/secureLinks.ts
const secureLinksUtil = `
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from './logger';

// Interface for token payload
interface SecureLinkPayload {
  id: string;       // Conversion ID or File ID
  fileName?: string; // Optional file name
  isPremium: boolean; // Whether this is a premium link
}

// Interface for validation result
interface ValidationResult {
  valid: boolean;
  id: string;
  fileName?: string;
  isPremium: boolean;
}

/**
 * Generate a secure download link token
 */
export function generateSecureLink(
  id: string,
  fileName: string = '',
  isPremium: boolean = false
): string {
  try {
    // Create payload
    const payload: SecureLinkPayload = {
      id,
      fileName,
      isPremium
    };
    
    // Generate token with short expiration
    // Non-premium links expire in 1 hour, premium links in 30 days
    const expiresIn = isPremium ? '30d' : '1h';
    
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn });
    
    // Return token as part of URL
    return \`/api/download/\${token}\`;
    
  } catch (error) {
    logger.error('Error generating secure link:', error);
    throw new Error('Failed to generate secure download link');
  }
}

/**
 * Validate a secure download link token
 */
export function validateSecureLink(token: string): ValidationResult {
  try {
    // Verify token
    const payload = jwt.verify(token, env.JWT_SECRET) as SecureLinkPayload;
    
    return {
      valid: true,
      id: payload.id,
      fileName: payload.fileName,
      isPremium: payload.isPremium
    };
    
  } catch (error) {
    logger.error('Error validating secure link:', error);
    return {
      valid: false,
      id: '',
      isPremium: false
    };
  }
}
`;

// File Storage Utility
// ===============
// packages/conversion-service/src/utils/fileStorage.ts
const fileStorageUtil = `
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { logger } from './logger';

// Initialize S3 client
const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  }
});

/**
 * Save a file to S3 storage
 */
export async function saveFileToS3(
  localFilePath: string,
  fileName: string,
  contentType: string,
  userId?: string
): Promise<string> {
  try {
    // Read file from local path
    const fileContent = fs.readFileSync(localFilePath);
    
    // Generate a unique key for S3
    const fileKey = \`\${userId ? userId + '/' : ''}\${uuidv4()}-\${fileName}\`;
    
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: fileKey,
      Body: fileContent,
      ContentType: contentType,
      ACL: 'private',
      Metadata: {
        'original-name': fileName,
        'user-id': userId || 'anonymous',
      },
    });
    
    await s3Client.send(command);
    
    logger.info(\`File uploaded to S3: \${fileKey}\`);
    
    // Return S3 key
    return fileKey;
  } catch (error) {
    logger.error('Error uploading file to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
}

/**
 * Generate a temporary URL for accessing a file from S3
 */
export async function getFileUrlFromS3(
  fileKey: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  try {
    // Create command for getting the object
    const command = new GetObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: fileKey,
    });
    
    // Generate presigned URL
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    return url;
  } catch (error) {
    logger.error('Error generating S3 file URL:', error);
    throw new Error('Failed to generate file URL');
  }
}

/**
 * Delete a file from S3 storage
 */
export async function deleteFileFromS3(fileKey: string): Promise<void> {
  try {
    // Create command for deleting the object
    const command = new DeleteObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: fileKey,
    });
    
    // Delete from S3
    await s3Client.send(command);
    
    logger.info(\`File deleted from S3: \${fileKey}\`);
  } catch (error) {
    logger.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
}

/**
 * Save a file to local storage
 */
export function saveFileToLocal(
  fileContent: Buffer,
  fileName: string,
  userId?: string
): string {
  try {
    // Determine base directory
    const baseDir = path.join(process.cwd(), 'uploads');
    
    // Create user-specific directory if provided
    const uploadDir = userId 
      ? path.join(baseDir, userId) 
      : path.join(baseDir, 'anonymous');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Generate unique filename
    const uniqueFileName = \`\${uuidv4()}-\${fileName}\`;
    const filePath = path.join(uploadDir, uniqueFileName);
    
    // Write file
    fs.writeFileSync(filePath, fileContent);
    
    logger.info(\`File saved locally: \${filePath}\`);
    
    return filePath;
  } catch (error) {
    logger.error('Error saving file locally:', error);
    throw new Error('Failed to save file locally');
  }
}

/**
 * Move a file from temp storage to permanent storage
 */
export function moveFile(
  sourcePath: string,
  targetPath: string
): boolean {
  try {
    // Create target directory if it doesn't exist
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Move file
    fs.renameSync(sourcePath, targetPath);
    
    logger.info(\`File moved from \${sourcePath} to \${targetPath}\`);
    
    return true;
  } catch (error) {
    logger.error('Error moving file:', error);
    return false;
  }
}

/**
 * Delete a file from local storage
 */
export function deleteLocalFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(\`File deleted: \${filePath}\`);
      return true;
    }
    
    logger.warn(\`File not found for deletion: \${filePath}\`);
    return false;
  } catch (error) {
    logger.error('Error deleting file:', error);
    return false;
  }
}
`;

// File Cleanup Utility
// ===============
// packages/conversion-service/src/utils/fileCleanup.ts
const fileCleanupUtil = `
import { ConversionService } from '../services/conversionService';
import { deleteLocalFile } from './fileStorage';
import { logger } from './logger';

// Conversion service
const conversionService = new ConversionService();

/**
 * Set up scheduled file cleanup
 */
export function setupFileCleanup(): void {
  // Run cleanup every day
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  // Schedule cleanup
  setInterval(async () => {
    try {
      await cleanupOldFiles();
    } catch (error) {
      logger.error('Error during scheduled file cleanup:', error);
    }
  }, ONE_DAY);
  
  // Run initial cleanup
  cleanupOldFiles().catch((error) => {
    logger.error('Error during initial file cleanup:', error);
  });
}

/**
 * Clean up old files that are no longer needed
 */
async function cleanupOldFiles(): Promise<void> {
  try {
    logger.info('Starting file cleanup process');
    
    // Get old conversions (more than 30 days old)
    const oldConversions = await conversionService.getOldConversions(30);
    
    logger.info(\`Found \${oldConversions.length} old conversions to clean up\`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each conversion
    for (const conversion of oldConversions) {
      try {
        // Delete input file
        if (conversion.filePath) {
          deleteLocalFile(conversion.filePath);
        }
        
        // Delete output file
        if (conversion.outputFilePath) {
          deleteLocalFile(conversion.outputFilePath);
        }
        
        successCount++;
      } catch (error) {
        logger.error(\`Error cleaning up conversion \${conversion.id}:\`, error);
        errorCount++;
      }
    }
    
    logger.info(\`File cleanup completed. Success: \${successCount}, Errors: \${errorCount}\`);
    
  } catch (error) {
    logger.error('Error in file cleanup process:', error);
    throw error;
  }
}
`;

// Logger Utility
// ==========
// packages/conversion-service/src/utils/logger.ts
const loggerUtil = `
import winston from 'winston';
import { env } from '../config/env';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define level based on environment
const level = () => {
  return env.NODE_ENV === 'development' ? 'debug' : 'info';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => \`\${info.timestamp} \${info.level}: \${info.message}\`
  )
);

// Define transports for different environments
const transports = [
  // Console transport for all environments
  new winston.transports.Console(),
];

// Add file transports for production
if (env.NODE_ENV === 'production') {
  transports.push(
    // Write all logs with level 'error' and below to 'error.log'
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level 'info' and below to 'combined.log'
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger instance
export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});
`;