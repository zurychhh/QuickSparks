import fs from 'fs';
import { Readable, Writable, Transform } from 'stream';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';
import logger from './logger';
import env from '../config/env';
import FileEncryption from './encryption/FileEncryption';
import { getErrorMessage } from './errorHandling';
import { createSafeReadStream, createSafeWriteStream, safeStreamPipeline } from './streamUtils';

// Constants
const STREAM_THRESHOLD = 5 * 1024 * 1024; // 5MB

/**
 * Stream options interface
 */
export interface StreamOptions {
  chunkSize?: number;
  highWaterMark?: number;
  encryptionKey?: Buffer;
  iv?: Buffer;
}

/**
 * Stream a file securely from source to destination with encryption
 * This maintains the original interface for backward compatibility while using the new implementation
 * @param {string} sourcePath - Path to source file 
 * @param {string} destinationPath - Path to destination file
 * @param {string} userId - User ID
 * @param {StreamOptions} options - Stream options
 * @returns {Promise<{ encryptionMethod: string; keyIdentifier: string }>}
 */
export async function streamFileSecurely(
  sourcePath: string, 
  destinationPath: string, 
  userId: string, 
  options: StreamOptions = {}
): Promise<{ encryptionMethod: string; keyIdentifier: string }> {
  try {
    // Use the new implementation
    const encryptResult = await FileEncryption.smartEncrypt(
      sourcePath,
      destinationPath,
      options.chunkSize || STREAM_THRESHOLD
    );
    
    return {
      encryptionMethod: 'aes-256-gcm',
      keyIdentifier: encryptResult.salt.substring(0, 8) // Use first 8 bytes of salt as key ID
    };
  } catch (error) {
    logger.error(`Error streaming file securely: ${sourcePath} to ${destinationPath}`, error);
    throw new Error(`Failed to stream file securely: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Stream an encrypted file for reading
 * This maintains the original interface for backward compatibility while using the new implementation
 * @param {string} filePath - Path to encrypted file
 * @param {string} userId - User ID
 * @param {Writable} outputStream - Output stream
 * @param {StreamOptions} options - Stream options
 * @returns {Promise<void>}
 */
export async function streamFileSecurelyForReading(
  filePath: string, 
  userId: string, 
  outputStream: Writable,
  options: StreamOptions = {}
): Promise<void> {
  // Create temporary file path for decryption
  const tempDir = path.dirname(filePath);
  const tempFile = path.join(tempDir, `.tmp_${Date.now()}_${path.basename(filePath)}`);
  
  try {
    // Ensure temp directory exists
    await fsPromises.mkdir(tempDir, { recursive: true }).catch(() => {});
    
    // Get file stats for size-based decision making
    const stats = await fsPromises.stat(filePath);
    const isLargeFile = stats.size > (options.chunkSize || STREAM_THRESHOLD);
    
    // For HTTP response headers - used when outputStream is a response object
    if ('setHeader' in outputStream && typeof (outputStream as any).setHeader === 'function') {
      // Set appropriate headers for streaming response
      // We don't set Content-Length because we're streaming
      (outputStream as any).setHeader('Transfer-Encoding', 'chunked');
    }
    
    // Try to detect file format and decrypt accordingly
    try {
      if (isLargeFile) {
        logger.info(`Using streaming for large file (${stats.size} bytes): ${filePath}`);
        
        // For large files, prefer streaming decryption via temp file
        await FileEncryption.smartDecrypt(
          filePath,
          tempFile,
          options.chunkSize || STREAM_THRESHOLD
        );
        
        // Create safe read stream from decrypted temp file
        const readStream = createSafeReadStream(tempFile, {
          highWaterMark: options.highWaterMark || 64 * 1024 // 64KB chunks by default
        });
        
        // Use safe pipeline to handle the stream
        await safeStreamPipeline(readStream, outputStream);
      } else {
        logger.info(`Using buffer decryption for small file (${stats.size} bytes): ${filePath}`);
        
        // For smaller files, try to decrypt in memory first using the unified method
        // This avoids temp file for small files
        try {
          // Read the entire file for in-memory processing
          const encryptedData = await fsPromises.readFile(filePath);
          let decryptedData: Buffer;
          
          try {
            // Try to decrypt with the new format
            decryptedData = await FileEncryption.decryptFile(filePath, tempFile)
              .then(() => fsPromises.readFile(tempFile));
          } catch (err) {
            // If new format fails, try legacy format
            logger.warn(`New format decryption failed, trying legacy: ${err instanceof Error ? err.message : String(err)}`);
            
            // Use legacy decryption for small files
            await legacyDecryptFile(filePath, tempFile, userId);
            decryptedData = await fsPromises.readFile(tempFile);
          }
          
          // Write the decrypted data directly to the output stream
          outputStream.write(decryptedData);
          if (outputStream.end) {
            outputStream.end();
          }
        } catch (err) {
          // If in-memory processing fails, fall back to file-based approach
          logger.warn(`In-memory decryption failed, falling back to file-based: ${err instanceof Error ? err.message : String(err)}`);
          
          // Try the file-based approach as a fallback
          await FileEncryption.smartDecrypt(filePath, tempFile);
          
          const readStream = createSafeReadStream(tempFile);
          await safeStreamPipeline(readStream, outputStream);
        }
      }
    } catch (error) {
      logger.error(`All decryption methods failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error; // Re-throw to be caught by outer catch block
    }
    
  } catch (error) {
    // Clean up temporary file
    try {
      await fsPromises.unlink(tempFile).catch(() => {});
    } catch (err) {
      // Ignore cleanup errors
    }
    
    logger.error(`Error streaming encrypted file for reading: ${filePath}`, error);
    
    // Special handling for HTTP responses
    if ('headersSent' in outputStream && (outputStream as any).headersSent) {
      logger.error('Error occurred after headers sent, cannot send error response');
      if ('end' in outputStream && typeof (outputStream as any).end === 'function' && !(outputStream as any).writableEnded) {
        (outputStream as any).end();
      }
    } else if ('status' in outputStream && typeof (outputStream as any).status === 'function') {
      // If it's a Response object that hasn't sent headers, send error response
      (outputStream as any).status(500).json({
        success: false,
        message: `Failed to stream encrypted file: ${error instanceof Error ? error.message : String(error)}`
      });
    } else {
      // For other writable streams, propagate the error
      if (outputStream.emit) {
        outputStream.emit('error', error);
      }
    }
    
    throw new Error(`Failed to stream encrypted file: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    // Ensure temp file is cleaned up
    try {
      await fsPromises.unlink(tempFile).catch(() => {});
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Legacy method to decrypt files with the old format
 * @param {string} inputPath - Path to encrypted file
 * @param {string} outputPath - Path for decrypted output 
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function legacyDecryptFile(
  inputPath: string,
  outputPath: string,
  userId: string
): Promise<void> {
  try {
    // Read encrypted file
    const encryptedFile = await fsPromises.readFile(inputPath);
    
    if (encryptedFile.length <= 48) { // 16 (salt) + 16 (iv) + 16 (authTag)
      throw new Error('Encrypted file is too small or corrupt');
    }
    
    // Extract components using old format
    const salt = encryptedFile.subarray(0, 16);
    const iv = encryptedFile.subarray(16, 32);
    const authTag = encryptedFile.subarray(32, 48);
    const encrypted = encryptedFile.subarray(48);
    
    // Get encryption key
    if (!env.FILE_ENCRYPTION_SECRET) {
      throw new Error('File encryption secret is not configured');
    }
    
    // Derive key using PBKDF2 - using old approach
    const key = crypto.pbkdf2Sync(env.FILE_ENCRYPTION_SECRET, salt, 100000, 32, 'sha512');
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    // Write decrypted file
    await fsPromises.writeFile(outputPath, decrypted);
  } catch (error) {
    logger.error(`Legacy decryption failed: ${inputPath}`, error);
    throw new Error(`Legacy decryption failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export default {
  streamFileSecurely,
  streamFileSecurelyForReading
};