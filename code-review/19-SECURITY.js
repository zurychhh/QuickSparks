/**
 * 19-SECURITY.js
 * 
 * This file contains security implementations and best practices for the project.
 */

// Secure Links Implementation
// ======================
// packages/conversion-service/src/utils/secureLinks.ts
const secureLinksImplementation = `
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from './logger';

// Interface for token payload
interface SecureLinkPayload {
  id: string;       // Conversion ID or File ID
  fileName?: string; // Optional file name
  isPremium: boolean; // Whether this is a premium link
  nonce: string;    // Unique nonce to prevent token reuse
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
    // Generate a random nonce
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Create payload
    const payload: SecureLinkPayload = {
      id,
      fileName,
      isPremium,
      nonce
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
    
    // Validation successful
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

/**
 * Add an extra layer of security by invalidating tokens after use
 * This would use a token blacklist or database tracking in a full implementation
 */
export function invalidateToken(token: string): boolean {
  try {
    // In a real implementation, you would:
    // 1. Decode the token to get its payload without verifying
    const decoded = jwt.decode(token) as SecureLinkPayload;
    
    if (!decoded || !decoded.nonce) {
      return false;
    }
    
    // 2. Add the token's nonce to a blacklist (e.g., Redis)
    // For example: await redisClient.set(\`token_blacklist:\${decoded.nonce}\`, '1', 'EX', 86400);
    
    logger.info(\`Token invalidated: nonce=\${decoded.nonce}\`);
    
    return true;
  } catch (error) {
    logger.error('Error invalidating token:', error);
    return false;
  }
}
`;

// Authentication Middleware Implementation
// ==================================
// packages/conversion-service/src/middleware/auth.ts
const authMiddlewareImplementation = `
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Rate limiting for authentication
import rateLimit from 'express-rate-limit';

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

// Rate limiting for login attempts
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

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
      
      // Additional token validation
      if (!decoded.id || !decoded.email) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Check token expiry
      const tokenExp = (decoded as any).exp;
      if (tokenExp && Date.now() >= tokenExp * 1000) {
        return res.status(401).json({ message: 'Token expired' });
      }
      
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
      logger.warn('Invalid token in optional auth, continuing as anonymous:', error);
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

/**
 * Generate a JWT token for a user
 */
export function generateAuthToken(userId: string, email: string, role?: string): string {
  const payload = {
    id: userId,
    email,
    role
  };
  
  // Token expires in 7 days
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Extract CSRF token from request
 */
export function validateCsrfToken(req: Request): boolean {
  // In a real implementation, you would validate CSRF token
  // This is a simplified example
  const csrfToken = req.headers['x-csrf-token'] as string;
  
  if (!csrfToken) {
    return false;
  }
  
  // Validate against session or cookie-stored token
  // For example: return csrfToken === req.session.csrfToken;
  
  return true;
}
`;

// File Security Implementation
// =======================
// packages/conversion-service/src/utils/fileStorage.ts
const fileSecurityImplementation = `
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
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
 * Generate a secure filename to prevent path traversal attacks
 */
function generateSecureFilename(originalName: string): string {
  // Get file extension
  const ext = path.extname(originalName);
  
  // Generate a random UUID
  const uuid = uuidv4();
  
  // Add a timestamp for uniqueness
  const timestamp = Date.now();
  
  // Create secure filename
  return \`\${uuid}-\${timestamp}\${ext}\`;
}

/**
 * Validate file type using content inspection
 */
function validateFileType(filePath: string, expectedType: string): boolean {
  try {
    // Read first few bytes of file
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(8);
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);
    
    // Check file signatures
    const signatures: Record<string, Buffer[]> = {
      'application/pdf': [Buffer.from('%PDF')],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
        Buffer.from('PK\\x03\\x04'),
      ],
    };
    
    // Get expected signatures
    const validSignatures = signatures[expectedType];
    
    if (!validSignatures) {
      return false;
    }
    
    // Check if file starts with any valid signature
    return validSignatures.some(signature => 
      buffer.slice(0, signature.length).equals(signature)
    );
    
  } catch (error) {
    logger.error('Error validating file type:', error);
    return false;
  }
}

/**
 * Encrypt a file before storing
 */
function encryptFile(filePath: string, encryptionKey: string): string {
  try {
    // Read file
    const fileData = fs.readFileSync(filePath);
    
    // Generate initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const key = crypto.createHash('sha256').update(encryptionKey).digest('base64').slice(0, 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    // Encrypt file
    const encrypted = Buffer.concat([iv, cipher.update(fileData), cipher.final()]);
    
    // Generate encrypted file path
    const encryptedFilePath = \`\${filePath}.enc\`;
    
    // Write encrypted file
    fs.writeFileSync(encryptedFilePath, encrypted);
    
    // Delete original file
    fs.unlinkSync(filePath);
    
    return encryptedFilePath;
  } catch (error) {
    logger.error('Error encrypting file:', error);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt a file
 */
function decryptFile(encryptedFilePath: string, encryptionKey: string): string {
  try {
    // Read encrypted file
    const encryptedData = fs.readFileSync(encryptedFilePath);
    
    // Extract initialization vector
    const iv = encryptedData.slice(0, 16);
    
    // Create decipher
    const key = crypto.createHash('sha256').update(encryptionKey).digest('base64').slice(0, 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    // Decrypt file
    const decrypted = Buffer.concat([
      decipher.update(encryptedData.slice(16)),
      decipher.final()
    ]);
    
    // Generate decrypted file path
    const decryptedFilePath = encryptedFilePath.replace('.enc', '');
    
    // Write decrypted file
    fs.writeFileSync(decryptedFilePath, decrypted);
    
    return decryptedFilePath;
  } catch (error) {
    logger.error('Error decrypting file:', error);
    throw new Error('Failed to decrypt file');
  }
}

/**
 * Save a file to S3 storage with security measures
 */
export async function saveSecureFileToS3(
  localFilePath: string,
  fileName: string,
  contentType: string,
  userId?: string
): Promise<string> {
  try {
    // Validate file type
    if (!validateFileType(localFilePath, contentType)) {
      throw new Error('File type validation failed');
    }
    
    // Generate secure filename
    const secureFileName = generateSecureFilename(fileName);
    
    // Read file from local path
    const fileContent = fs.readFileSync(localFilePath);
    
    // Generate a unique key for S3
    const fileKey = \`\${userId ? userId + '/' : ''}\${secureFileName}\`;
    
    // Optional: Encrypt file before upload
    // const encryptedFilePath = encryptFile(localFilePath, env.FILE_ENCRYPTION_KEY);
    // const encryptedContent = fs.readFileSync(encryptedFilePath);
    
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
    
    logger.info(\`File uploaded securely to S3: \${fileKey}\`);
    
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
export async function getSecureFileUrlFromS3(
  fileKey: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  try {
    // Create command for getting the object
    const command = new GetObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: fileKey,
    });
    
    // Generate presigned URL with short expiration
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    return url;
  } catch (error) {
    logger.error('Error generating S3 file URL:', error);
    throw new Error('Failed to generate file URL');
  }
}

/**
 * Sanitize file path to prevent path traversal attacks
 */
export function sanitizeFilePath(userPath: string): string {
  // Normalize the path to resolve any '..' or '.' segments
  const normalizedPath = path.normalize(userPath);
  
  // Get the basename to remove any directory traversal
  const safePath = path.basename(normalizedPath);
  
  return safePath;
}
`;

// Cross-Site Scripting (XSS) Protection
// ===============================
// packages/conversion-service/src/middleware/security.ts
const xssProtectionMiddleware = `
import { Request, Response, NextFunction } from 'express';
import { sanitize } from 'xss-filters';
import { logger } from '../utils/logger';

/**
 * Middleware to sanitize request inputs against XSS attacks
 */
export const xssSanitizer = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  // Handle objects
  const result: Record<string, any> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Sanitize string values
        result[key] = sanitize(value);
      } else if (typeof value === 'object') {
        // Recursively sanitize nested objects
        result[key] = sanitizeObject(value);
      } else {
        // Keep non-string values as is
        result[key] = value;
      }
    }
  }
  
  return result;
}

/**
 * Set security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; connect-src 'self' https://api.stripe.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; frame-src https://js.stripe.com"
  );
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'same-origin');
  
  next();
};

/**
 * CORS configuration middleware
 */
export const corsConfig = (allowedOrigins: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    
    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // Default to no CORS in production
      res.setHeader('Access-Control-Allow-Origin', '');
    }
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    next();
  };
};
`;