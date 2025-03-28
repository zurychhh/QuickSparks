import crypto from 'crypto';
import env from '../config/env';
import logger from './logger';

/**
 * Generate a secure download token
 * @param fileId File ID to be downloaded
 * @param userId User ID requesting the download
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 */
export function generateDownloadToken(
  fileId: string,
  userId: string,
  expiresIn: number = 3600
): string {
  try {
    // Generate expiration timestamp
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
    
    // Create payload
    const payload = {
      fileId,
      userId,
      expiresAt,
    };
    
    // Stringify and encode payload
    const payloadString = JSON.stringify(payload);
    const payloadBase64 = Buffer.from(payloadString).toString('base64');
    
    // Generate signature
    const signature = crypto
      .createHmac('sha256', env.SECURE_TOKEN_SECRET)
      .update(payloadBase64)
      .digest('base64url');
    
    // Combine payload and signature
    return `${payloadBase64}.${signature}`;
  } catch (error) {
    logger.error('Error generating download token', error);
    throw new Error('Failed to generate secure download token');
  }
}

/**
 * Verify and decode a download token
 */
export function verifyDownloadToken(token: string): { fileId: string; userId: string } | null {
  try {
    // Split token into payload and signature
    const [payloadBase64, signature] = token.split('.');
    
    if (!payloadBase64 || !signature) {
      return null;
    }
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', env.SECURE_TOKEN_SECRET)
      .update(payloadBase64)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    // Decode payload
    const payloadString = Buffer.from(payloadBase64, 'base64').toString();
    const payload = JSON.parse(payloadString);
    
    // Check if token is expired
    if (payload.expiresAt < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return {
      fileId: payload.fileId,
      userId: payload.userId,
    };
  } catch (error) {
    logger.error('Error verifying download token', error);
    return null;
  }
}

export default {
  generateDownloadToken,
  verifyDownloadToken,
};