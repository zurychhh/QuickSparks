import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import logger from '../logger';
import env from '../../config/env';
import { getErrorMessage } from '../errorHandling';
import { validateFile } from '../fileValidation';

// Constants for encryption settings
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const HEADER_LENGTH = SALT_LENGTH + IV_LENGTH; // 32 bytes

/**
 * File header format for both streaming and buffer methods:
 * [0-15]   : Salt (16 bytes)
 * [16-31]  : IV (16 bytes)
 * Data starts at position 32
 * Auth tag is stored separately in a .tag file
 */

class FileEncryption {
  /**
   * Derives an encryption key from the master key and a salt
   * @param {Buffer} salt - Random salt
   * @returns {Promise<Buffer>} - Derived key
   */
  static async deriveKey(salt: Buffer): Promise<Buffer> {
    if (!env.FILE_ENCRYPTION_SECRET) {
      throw new Error('FILE_ENCRYPTION_SECRET environment variable is not set');
    }

    return new Promise<Buffer>((resolve, reject) => {
      crypto.pbkdf2(
        env.FILE_ENCRYPTION_SECRET,
        salt,
        100000, // High iteration count for security
        32, // KEY_LENGTH (256 bits)
        'sha256',
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });
  }

  /**
   * Encrypts a file using buffer-based approach (for small files)
   * @param {string} inputPath - Path to input file
   * @param {string} outputPath - Path to output file
   * @returns {Promise<{path: string, iv: string, salt: string, tagPath: string}>}
   */
  static async encryptFile(inputPath: string, outputPath: string): Promise<{
    path: string;
    iv: string;
    salt: string;
    tagPath: string;
  }> {
    try {
      // Read the input file
      const data = await fsPromises.readFile(inputPath);

      // Generate salt and IV
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);

      // Derive key
      const key = await this.deriveKey(salt);

      // Create cipher
      const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

      // Encrypt data
      const encrypted = Buffer.concat([
        cipher.update(data),
        cipher.final()
      ]);

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Prepare final buffer with header
      const finalBuffer = Buffer.concat([
        salt,      // First 16 bytes: Salt
        iv,        // Next 16 bytes: IV
        encrypted  // Rest: Encrypted data
      ]);

      // Write encrypted file
      await fsPromises.writeFile(outputPath, finalBuffer);

      // Write auth tag to separate file
      const tagPath = `${outputPath}.tag`;
      await fsPromises.writeFile(tagPath, authTag);

      return {
        path: outputPath,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        tagPath
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`File encryption failed: ${error.message}`);
      } else {
        throw new Error('File encryption failed with unknown error');
      }
    }
  }

  /**
   * Decrypts a file using buffer-based approach (for small files)
   * Supports both new format and legacy format for backward compatibility
   * @param {string} inputPath - Path to encrypted file
   * @param {string} outputPath - Path for decrypted output
   * @returns {Promise<{path: string}>}
   */
  static async decryptFile(inputPath: string, outputPath: string): Promise<{path: string}> {
    try {
      // Read encrypted file
      const data = await fsPromises.readFile(inputPath);

      if (data.length <= HEADER_LENGTH) {
        throw new Error('Encrypted file is too small or corrupt');
      }

      // First try new format
      try {
        return await this.decryptNewFormat(data, inputPath, outputPath);
      } catch (error) {
        // If new format fails, try legacy format
        logger.warn(`New format decryption failed, trying legacy format: ${error instanceof Error ? error.message : String(error)}`);
        return await this.decryptLegacyFormat(data, inputPath, outputPath);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`File decryption failed: ${error.message}`);
      } else {
        throw new Error('File decryption failed with unknown error');
      }
    }
  }

  /**
   * Decrypts using the new format (salt + IV in header, auth tag in separate file)
   * @param {Buffer} data - Encrypted file data
   * @param {string} inputPath - Path to encrypted file
   * @param {string} outputPath - Path for decrypted output
   * @returns {Promise<{path: string}>}
   */
  private static async decryptNewFormat(
    data: Buffer, 
    inputPath: string, 
    outputPath: string
  ): Promise<{path: string}> {
    // Extract salt and IV from header
    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, HEADER_LENGTH);

    // Extract encrypted data
    const encrypted = data.subarray(HEADER_LENGTH);

    // Read auth tag from separate file
    const tagPath = `${inputPath}.tag`;
    let authTag: Buffer;
    try {
      authTag = await fsPromises.readFile(tagPath);
    } catch (error) {
      throw new Error(`Auth tag file not found or not readable: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Derive key
    const key = await this.deriveKey(salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt data
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    // Write decrypted file
    await fsPromises.writeFile(outputPath, decrypted);

    return { path: outputPath };
  }

  /**
   * Decrypts using the legacy format (salt + IV + authTag in the file header)
   * @param {Buffer} data - Encrypted file data
   * @param {string} inputPath - Path to encrypted file (not used in this method)
   * @param {string} outputPath - Path for decrypted output
   * @returns {Promise<{path: string}>}
   */
  private static async decryptLegacyFormat(
    data: Buffer, 
    inputPath: string, 
    outputPath: string
  ): Promise<{path: string}> {
    if (data.length <= 48) { // 16 (salt) + 16 (iv) + 16 (authTag)
      throw new Error('Encrypted file is too small or corrupt for legacy format');
    }

    // Extract components using old format
    const salt = data.subarray(0, 16);
    const iv = data.subarray(16, 32);
    const authTag = data.subarray(32, 48);
    const encrypted = data.subarray(48);

    // Get encryption key from environment
    if (!env.FILE_ENCRYPTION_SECRET) {
      throw new Error('File encryption secret is not configured');
    }

    // Derive key using PBKDF2 - using legacy approach
    const key = crypto.pbkdf2Sync(env.FILE_ENCRYPTION_SECRET, salt, 100000, 32, 'sha512');

    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt data
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    // Write decrypted file
    await fsPromises.writeFile(outputPath, decrypted);

    return { path: outputPath };
  }

  /**
   * Encrypts a file using streaming approach (for large files)
   * @param {string} inputPath - Path to input file
   * @param {string} outputPath - Path to output file
   * @returns {Promise<{path: string, iv: string, salt: string, tagPath: string}>}
   */
  static async encryptFileStream(inputPath: string, outputPath: string): Promise<{
    path: string;
    iv: string;
    salt: string;
    tagPath: string;
  }> {
    // File handles for proper cleanup
    let readStream: fs.ReadStream | null = null;
    let writeStream: fs.WriteStream | null = null;

    try {
      // Generate salt and IV
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);

      // Derive key
      const key = await this.deriveKey(salt);

      // Create cipher
      const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

      // Create streams
      readStream = createReadStream(inputPath);
      writeStream = createWriteStream(outputPath);

      // Write header (salt + IV)
      writeStream.write(Buffer.concat([salt, iv]));

      // Process streams with pipeline
      await pipeline(readStream, cipher, writeStream);

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Write auth tag to separate file
      const tagPath = `${outputPath}.tag`;
      await fsPromises.writeFile(tagPath, authTag);

      return {
        path: outputPath,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        tagPath
      };
    } catch (error) {
      // Clean up partial output file if it exists
      try {
        await fsPromises.unlink(outputPath).catch(() => {});
        await fsPromises.unlink(`${outputPath}.tag`).catch(() => {});
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      if (error instanceof Error) {
        throw new Error(`File encryption failed: ${error.message}`);
      } else {
        throw new Error('File encryption failed with unknown error');
      }
    } finally {
      // Ensure streams are properly closed
      if (readStream && !readStream.destroyed) readStream.destroy();
      if (writeStream && !writeStream.destroyed) writeStream.destroy();
    }
  }

  /**
   * Decrypts a file using streaming approach (for large files)
   * Supports both new format and legacy format for backward compatibility
   * @param {string} inputPath - Path to encrypted file
   * @param {string} outputPath - Path for decrypted output
   * @returns {Promise<{path: string}>}
   */
  static async decryptFileStream(inputPath: string, outputPath: string): Promise<{path: string}> {
    // File handles for proper cleanup
    let readStream: fs.ReadStream | null = null;
    let writeStream: fs.WriteStream | null = null;

    try {
      // Try the new format first
      try {
        return await this.decryptFileStreamNewFormat(inputPath, outputPath);
      } catch (error) {
        // If new format fails, try legacy format
        logger.warn(`New format stream decryption failed, trying legacy format: ${error instanceof Error ? error.message : String(error)}`);
        return await this.decryptFileStreamLegacyFormat(inputPath, outputPath);
      }
    } catch (error) {
      // Clean up partial output file if it exists
      try {
        await fsPromises.unlink(outputPath).catch(() => {});
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      if (error instanceof Error) {
        throw new Error(`File stream decryption failed: ${error.message}`);
      } else {
        throw new Error('File stream decryption failed with unknown error');
      }
    }
  }

  /**
   * Decrypts a file using streaming approach with new format
   * @param {string} inputPath - Path to encrypted file
   * @param {string} outputPath - Path for decrypted output
   * @returns {Promise<{path: string}>}
   */
  private static async decryptFileStreamNewFormat(
    inputPath: string, 
    outputPath: string
  ): Promise<{path: string}> {
    // File handles for proper cleanup
    let readStream: fs.ReadStream | null = null;
    let writeStream: fs.WriteStream | null = null;

    try {
      // Read the header data (first HEADER_LENGTH bytes)
      const headerBuffer = Buffer.alloc(HEADER_LENGTH);
      const fileHandle = await fsPromises.open(inputPath, 'r');

      try {
        const { bytesRead } = await fileHandle.read(headerBuffer, 0, HEADER_LENGTH, 0);
        if (bytesRead !== HEADER_LENGTH) {
          throw new Error('Could not read encryption header');
        }
      } finally {
        await fileHandle.close();
      }

      // Extract salt and IV from header
      const salt = headerBuffer.subarray(0, SALT_LENGTH);
      const iv = headerBuffer.subarray(SALT_LENGTH, HEADER_LENGTH);

      // Read auth tag from separate file
      const tagPath = `${inputPath}.tag`;
      const authTag = await fsPromises.readFile(tagPath);

      // Derive key
      const key = await this.deriveKey(salt);

      // Create decipher
      const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // Create streams
      readStream = createReadStream(inputPath, { start: HEADER_LENGTH });
      writeStream = createWriteStream(outputPath);

      // Process streams with pipeline
      await pipeline(readStream, decipher, writeStream);

      return { path: outputPath };
    } catch (error) {
      // Clean up partial output file if it exists
      try {
        await fsPromises.unlink(outputPath).catch(() => {});
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      if (error instanceof Error) {
        throw new Error(`New format stream decryption failed: ${error.message}`);
      } else {
        throw new Error('New format stream decryption failed with unknown error');
      }
    } finally {
      // Ensure streams are properly closed
      if (readStream && !readStream.destroyed) readStream.destroy();
      if (writeStream && !writeStream.destroyed) writeStream.destroy();
    }
  }

  /**
   * Decrypts a file using streaming approach with legacy format
   * @param {string} inputPath - Path to encrypted file
   * @param {string} outputPath - Path for decrypted output
   * @returns {Promise<{path: string}>}
   */
  private static async decryptFileStreamLegacyFormat(
    inputPath: string, 
    outputPath: string
  ): Promise<{path: string}> {
    // File handles for proper cleanup
    let readStream: fs.ReadStream | null = null;
    let writeStream: fs.WriteStream | null = null;
    
    try {
      // Get the file size
      const stats = await fsPromises.stat(inputPath);
      
      // For files over 100MB, we use a chunked approach to avoid memory issues
      if (stats.size > 100 * 1024 * 1024) { // 100MB
        logger.info(`Using chunked approach for large legacy file: ${inputPath} (${stats.size} bytes)`);
        
        // First read just the header (first 48 bytes) to extract salt, IV, and authTag
        const headerBuffer = Buffer.alloc(48); // 16 (salt) + 16 (iv) + 16 (authTag)
        const fileHandle = await fsPromises.open(inputPath, 'r');
        
        try {
          const { bytesRead } = await fileHandle.read(headerBuffer, 0, 48, 0);
          if (bytesRead !== 48) {
            throw new Error('Could not read legacy encryption header');
          }
        } finally {
          await fileHandle.close();
        }
        
        // Extract components from header
        const salt = headerBuffer.subarray(0, 16);
        const iv = headerBuffer.subarray(16, 32);
        const authTag = headerBuffer.subarray(32, 48);
        
        // Derive key
        if (!env.FILE_ENCRYPTION_SECRET) {
          throw new Error('File encryption secret is not configured');
        }
        const key = crypto.pbkdf2Sync(env.FILE_ENCRYPTION_SECRET, salt, 100000, 32, 'sha512');
        
        // Create decipher
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        
        // Create streams 
        readStream = createReadStream(inputPath, { start: 48 }); // Skip header
        writeStream = createWriteStream(outputPath);
        
        // Process streams with pipeline
        await pipeline(readStream, decipher, writeStream);
        
        return { path: outputPath };
      } else {
        // For smaller files, we can safely use the buffer approach
        logger.info(`Using buffer approach for smaller legacy file: ${inputPath} (${stats.size} bytes)`);
        
        // Read the entire file
        const data = await fsPromises.readFile(inputPath);
        
        // Use the legacy decryption method
        return await this.decryptLegacyFormat(data, inputPath, outputPath);
      }
    } catch (error) {
      // Clean up partial output file if it exists
      try {
        await fsPromises.unlink(outputPath).catch(() => {});
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      if (error instanceof Error) {
        throw new Error(`Legacy format stream decryption failed: ${error.message}`);
      } else {
        throw new Error('Legacy format stream decryption failed with unknown error');
      }
    } finally {
      // Ensure streams are properly closed
      if (readStream && !readStream.destroyed) readStream.destroy();
      if (writeStream && !writeStream.destroyed) writeStream.destroy();
    }
  }

  /**
   * Smart encryption method that chooses between buffer and stream approach
   * based on file size
   * @param {string} inputPath - Path to input file
   * @param {string} outputPath - Path to output file
   * @param {number} thresholdSize - Size threshold for streaming (bytes)
   * @returns {Promise<{path: string, iv: string, salt: string, tagPath: string}>}
   */
  static async smartEncrypt(
    inputPath: string, 
    outputPath: string, 
    thresholdSize = 5 * 1024 * 1024
  ): Promise<{
    path: string;
    iv: string;
    salt: string;
    tagPath: string;
  }> {
    try {
      // Validate file before encryption
      const validation = await validateFile(inputPath, {
        maxSize: 200 * 1024 * 1024, // 200MB max file size
        validateContent: true // Enable content validation
      });

      if (!validation.valid) {
        throw new Error(`File validation failed: ${validation.reason}`);
      }

      logger.info(`File validation passed for: ${inputPath} (${validation.type}, ${validation.size} bytes)`);
      
      // Get file stats
      const stats = await fsPromises.stat(inputPath);

      // Choose approach based on file size
      if (stats.size > thresholdSize) {
        // Use streaming for large files
        logger.info(`Using streaming encryption for large file: ${inputPath} (${stats.size} bytes)`);
        return await this.encryptFileStream(inputPath, outputPath);
      } else {
        // Use buffer approach for small files
        logger.info(`Using buffer encryption for small file: ${inputPath} (${stats.size} bytes)`);
        return await this.encryptFile(inputPath, outputPath);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Smart encryption failed: ${error.message}`);
      } else {
        throw new Error('Smart encryption failed with unknown error');
      }
    }
  }

  /**
   * Smart decryption method that works with files encrypted by either method
   * @param {string} inputPath - Path to encrypted file
   * @param {string} outputPath - Path for decrypted output
   * @param {number} thresholdSize - Size threshold for streaming (bytes)
   * @returns {Promise<{path: string}>}
   */
  static async smartDecrypt(
    inputPath: string, 
    outputPath: string, 
    thresholdSize = 5 * 1024 * 1024
  ): Promise<{path: string}> {
    try {
      // Validate input and output paths
      if (!inputPath || typeof inputPath !== 'string') {
        throw new Error('Invalid input path');
      }
      
      if (!outputPath || typeof outputPath !== 'string') {
        throw new Error('Invalid output path');
      }
      
      // Check if input file exists
      try {
        await fsPromises.access(inputPath, fs.constants.R_OK);
      } catch (error) {
        throw new Error(`Input file not found or not readable: ${inputPath}`);
      }
      
      // Check if output directory exists
      const outputDir = path.dirname(outputPath);
      try {
        await fsPromises.access(outputDir, fs.constants.W_OK);
      } catch (error) {
        // Try to create the output directory
        try {
          await fsPromises.mkdir(outputDir, { recursive: true });
        } catch (mkdirError) {
          throw new Error(`Cannot create output directory: ${outputDir}`);
        }
      }
      
      // Get file stats
      const stats = await fsPromises.stat(inputPath);
      
      // Minimum size validation
      if (stats.size < 32) { // At least need salt+IV (32 bytes)
        throw new Error('File is too small to be a valid encrypted file');
      }
      
      // Detect file format by reading the first few bytes
      const headerCheck = Buffer.alloc(48); // Size that covers both formats' headers
      const fd = await fsPromises.open(inputPath, 'r');
      
      try {
        await fd.read(headerCheck, 0, 48, 0);
      } finally {
        await fd.close();
      }
      
      // Look for tag file - presence indicates new format
      const tagExists = await fsPromises.access(`${inputPath}.tag`, fs.constants.R_OK)
        .then(() => true)
        .catch(() => false);
      
      const format = tagExists ? 'new' : 'legacy';
      logger.info(`Detected ${format} encryption format for file: ${inputPath}`);

      // Choose approach based on file size
      if (stats.size > thresholdSize + HEADER_LENGTH) {
        // Use streaming for large files
        logger.info(`Using streaming decryption for large file: ${inputPath} (${stats.size} bytes)`);
        return await this.decryptFileStream(inputPath, outputPath);
      } else {
        // Use buffer approach for small files
        logger.info(`Using buffer decryption for small file: ${inputPath} (${stats.size} bytes)`);
        return await this.decryptFile(inputPath, outputPath);
      }
    } catch (error) {
      // Clean up any partial output file
      try {
        await fsPromises.unlink(outputPath).catch(() => {});
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      if (error instanceof Error) {
        throw new Error(`Smart decryption failed: ${error.message}`);
      } else {
        throw new Error('Smart decryption failed with unknown error');
      }
    }
  }
}

export default FileEncryption;