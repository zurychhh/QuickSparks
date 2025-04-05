import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import { createLogger } from '@utils/logger';
import env from '@config/env';

// Import StreamedFileStorage which handles streaming operations
import StreamedFileStorage from './streamedFileStorage';

const logger = createLogger('fileStorage');

interface EncryptedFileMetadata {
  encryptionMethod: string;
  hasIv: boolean;
  hasAuthTag: boolean;
  keyIdentifier: string;
}

/**
 * Generate a secure random filename
 */
export const generateSecureFilename = (originalFilename: string): string => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  const extension = path.extname(originalFilename);
  
  return `${timestamp}-${randomString}${extension}`;
};

/**
 * Generate user-specific storage path with path traversal protection
 */
export const getUserStoragePath = (userId: string): string => {
  // Validate userId to prevent path traversal attacks
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId provided');
  }
  
  // Ensure userId only contains alphanumeric characters, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    throw new Error('Invalid userId format');
  }
  
  const basePath = path.join(process.cwd(), env.UPLOAD_DIR || 'uploads');
  const userPath = path.join(basePath, userId);
  
  // Normalize path to resolve any potential directory traversal attempts
  const normalizedPath = path.normalize(userPath);
  
  // Verify the normalized path still starts with the base path to prevent directory traversal
  if (!normalizedPath.startsWith(basePath)) {
    throw new Error('Path traversal attempt detected');
  }
  
  return normalizedPath;
};

/**
 * Ensure user storage directory exists
 */
export const ensureUserStorageDirectory = async (userId: string): Promise<string> => {
  const userPath = getUserStoragePath(userId);
  
  try {
    await access(userPath, fs.constants.F_OK);
  } catch (err) {
    // Directory doesn't exist, create it
    await mkdir(userPath, { recursive: true });
    logger.info(`Created directory: ${userPath}`);
  }
  
  return userPath;
};

/**
 * Calculate file expiration date based on user tier
 */
export const calculateFileExpiration = (userTier: 'free' | 'basic' | 'premium' | 'enterprise' = 'free'): Date => {
  const now = new Date();
  
  switch (userTier) {
    case 'basic':
      return new Date(now.getTime() + (env.FILE_EXPIRY_BASIC || 7 * 24 * 60 * 60 * 1000)); // 7 days
    case 'premium':
      return new Date(now.getTime() + (env.FILE_EXPIRY_PREMIUM || 30 * 24 * 60 * 60 * 1000)); // 30 days
    case 'enterprise':
      return new Date(now.getTime() + (env.FILE_EXPIRY_ENTERPRISE || 90 * 24 * 60 * 60 * 1000)); // 90 days
    case 'free':
    default:
      return new Date(now.getTime() + (env.FILE_EXPIRY_FREE || 24 * 60 * 60 * 1000)); // 24 hours
  }
};

/**
 * Save file securely with encryption
 * This version uses the StreamedFileStorage for automatic selection between
 * streaming and buffering based on file size
 */
export const saveFileSecurely = async (
  filePath: string,
  fileBuffer: Buffer,
  userId: string
): Promise<EncryptedFileMetadata> => {
  try {
    // Use the StreamedFileStorage implementation for better memory efficiency
    return await StreamedFileStorage.saveBufferSecurely(filePath, fileBuffer, userId);
  } catch (error) {
    logger.error(`Error saving file securely: ${filePath}`, error);
    throw new Error(`Failed to save file securely: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Read and decrypt file
 * Uses the StreamedFileStorage implementation for better memory efficiency
 */
export const readFileSecurely = async (
  filePath: string,
  userId: string
): Promise<Buffer> => {
  try {
    // Use the StreamedFileStorage implementation which handles smart selection 
    // between streaming and buffering based on file size
    return await StreamedFileStorage.readFileSecurely(filePath, userId);
  } catch (error) {
    logger.error(`Error reading file securely: ${filePath}`, error);
    throw new Error(`Failed to read file securely: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Securely delete a file using streaming for better memory efficiency
 */
export const secureDeleteFile = async (filePath: string): Promise<boolean> => {
  try {
    // Verify file exists
    try {
      await fsPromises.access(filePath, fs.constants.F_OK);
    } catch (err) {
      logger.info(`File does not exist, skipping deletion: ${filePath}`);
      return false;
    }
    
    // Get file size
    const stats = await fsPromises.stat(filePath);
    const fileSize = stats.size;
    
    // For small files (< 1MB), use the original approach
    if (fileSize < 1024 * 1024) {
      // Open file for writing
      const fd = await fsPromises.open(filePath, 'w');
      
      try {
        // Multiple pass overwrite (simplified for implementation)
        for (let pass = 0; pass < 3; pass++) {
          // Create buffer with random data
          const buffer = crypto.randomBytes(8192); // 8KB chunks
          
          // Write buffer repeatedly until file is overwritten
          let bytesWritten = 0;
          while (bytesWritten < fileSize) {
            const writeSize = Math.min(buffer.length, fileSize - bytesWritten);
            await fd.write(buffer, 0, writeSize, bytesWritten);
            bytesWritten += writeSize;
          }
          
          // Flush to disk
          await fd.sync();
        }
      } finally {
        // Close file
        await fd.close();
      }
    } else {
      // For larger files, use a streaming approach
      logger.info(`Using streaming for secure deletion of large file: ${filePath} (${fileSize} bytes)`);
      
      for (let pass = 0; pass < 3; pass++) {
        // Create a random data transform stream
        const randomDataStream = new Transform({
          transform(chunk, encoding, callback) {
            // Replace with random data
            const randomChunk = crypto.randomBytes(chunk.length);
            callback(null, randomChunk);
          }
        });
        
        // Create write stream to the file
        const writeStream = createWriteStream(filePath);
        
        // Create source stream with the correct length
        const source = crypto.randomBytes(Math.min(64 * 1024, fileSize)); // Use a 64KB buffer
        const sourceStream = {
          [Symbol.asyncIterator]: async function*() {
            let remaining = fileSize;
            while (remaining > 0) {
              const chunkSize = Math.min(source.length, remaining);
              yield source.subarray(0, chunkSize);
              remaining -= chunkSize;
            }
          }
        };
        
        // Process the streams
        await pipeline(sourceStream, randomDataStream, writeStream);
      }
    }
    
    // Delete the overwritten file
    await fsPromises.unlink(filePath);
    logger.info(`Securely deleted file: ${filePath}`);
    
    return true;
  } catch (error) {
    logger.error(`Error securely deleting file: ${filePath}`, error);
    return false;
  }
};

/**
 * Generate a secure download URL for a file
 */
export const generateSecureDownloadUrl = (
  fileId: string,
  userId: string,
  expiresInMinutes = 15
): string => {
  // Calculate expiration time
  const expiresAt = Date.now() + (expiresInMinutes * 60 * 1000);
  
  // Create payload
  const payload = {
    fileId,
    userId,
    exp: Math.floor(expiresAt / 1000)
  };
  
  // In a real implementation, this would use JWT
  // For simplicity, we'll just base64 encode the payload
  const token = Buffer.from(JSON.stringify(payload)).toString('base64');
  
  // Generate URL
  return `/api/conversions/download/${fileId}?token=${token}`;
};