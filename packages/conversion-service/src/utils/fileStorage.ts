import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import env from '../config/env';
import logger from './logger';
import { UserTier } from '../types/conversion';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);
const fsync = promisify(fs.fsync);
const open = promisify(fs.open);
const close = promisify(fs.close);
const access = promisify(fs.access);

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
 * Generate user-specific storage path
 */
export const getUserStoragePath = (userId: string, directory: 'uploads' | 'outputs'): string => {
  const basePath = path.join(process.cwd(), directory === 'uploads' ? env.UPLOADS_DIR : env.OUTPUTS_DIR);
  const userPath = path.join(basePath, userId);
  
  return userPath;
};

/**
 * Ensure user storage directory exists
 */
export const ensureUserStorageDirectory = async (userId: string, directory: 'uploads' | 'outputs'): Promise<string> => {
  const userPath = getUserStoragePath(userId, directory);
  
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
export const calculateFileExpiration = (userTier: UserTier = 'free'): Date => {
  const now = new Date();
  
  switch (userTier) {
    case 'basic':
      return new Date(now.getTime() + env.FILE_EXPIRY_BASIC);
    case 'premium':
      return new Date(now.getTime() + env.FILE_EXPIRY_PREMIUM);
    case 'enterprise':
      return new Date(now.getTime() + env.FILE_EXPIRY_ENTERPRISE);
    case 'free':
    default:
      return new Date(now.getTime() + env.FILE_EXPIRY_FREE);
  }
};

/**
 * Save file securely with encryption
 */
export const saveFileSecurely = async (
  filePath: string,
  fileBuffer: Buffer,
  userId: string
): Promise<EncryptedFileMetadata> => {
  // Get encryption key
  const keySecret = env.FILE_ENCRYPTION_SECRET;
  const keyIdentifier = crypto.createHash('sha256').update(userId + keySecret).digest('hex').substring(0, 8);
  
  // Derive a key using PBKDF2
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(keySecret + userId, salt, 100000, 32, 'sha512');
  
  // Generate initialization vector
  const iv = crypto.randomBytes(16);
  
  // Create cipher and encrypt
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(fileBuffer),
    cipher.final()
  ]);
  
  // Get authentication tag
  const authTag = cipher.getAuthTag();
  
  // Compose final encrypted file with metadata
  const encryptedFile = Buffer.concat([
    salt,
    iv,
    authTag,
    encrypted
  ]);
  
  // Write encrypted file
  await writeFile(filePath, encryptedFile);
  
  // Return metadata for database
  return {
    encryptionMethod: 'aes-256-gcm',
    hasIv: true,
    hasAuthTag: true,
    keyIdentifier
  };
};

/**
 * Read and decrypt file
 */
export const readFileSecurely = async (
  filePath: string,
  userId: string
): Promise<Buffer> => {
  // Read encrypted file
  const encryptedFile = await readFile(filePath);
  
  // Extract components
  const salt = encryptedFile.subarray(0, 16);
  const iv = encryptedFile.subarray(16, 32);
  const authTag = encryptedFile.subarray(32, 48);
  const encrypted = encryptedFile.subarray(48);
  
  // Get encryption key
  const keySecret = env.FILE_ENCRYPTION_SECRET;
  
  // Derive key using PBKDF2
  const key = crypto.pbkdf2Sync(keySecret + userId, salt, 100000, 32, 'sha512');
  
  // Create decipher
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  // Decrypt
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return decrypted;
};

/**
 * Securely delete a file
 */
export const secureDeleteFile = async (filePath: string): Promise<boolean> => {
  try {
    // Verify file exists
    try {
      await access(filePath, fs.constants.F_OK);
    } catch (err) {
      logger.info(`File does not exist, skipping deletion: ${filePath}`);
      return false;
    }
    
    // Get file size
    const stats = await stat(filePath);
    const fileSize = stats.size;
    
    // Open file for writing
    const fd = await open(filePath, 'w');
    
    try {
      // Multiple pass overwrite (simplified for implementation)
      for (let pass = 0; pass < 3; pass++) {
        // Create buffer with random data
        const buffer = crypto.randomBytes(8192); // 8KB chunks
        
        // Write buffer repeatedly until file is overwritten
        let bytesWritten = 0;
        while (bytesWritten < fileSize) {
          const writeSize = Math.min(buffer.length, fileSize - bytesWritten);
          await fs.promises.write(fd, buffer, 0, writeSize, bytesWritten);
          bytesWritten += writeSize;
        }
        
        // Flush to disk
        await fsync(fd);
      }
    } finally {
      // Close file
      await close(fd);
    }
    
    // Delete the overwritten file
    await unlink(filePath);
    logger.info(`Securely deleted file: ${filePath}`);
    
    return true;
  } catch (error) {
    logger.error(`Error securely deleting file: ${filePath}`, error);
    return false;
  }
};

export default {
  generateSecureFilename,
  getUserStoragePath,
  ensureUserStorageDirectory,
  calculateFileExpiration,
  saveFileSecurely,
  readFileSecurely,
  secureDeleteFile
};