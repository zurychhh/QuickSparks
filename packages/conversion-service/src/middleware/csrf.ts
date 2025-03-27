import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';

// CSRF token store for development
// In production, this should be stored in Redis or another shared store
const csrfTokens: Record<string, { token: string; expires: Date }> = {};

/**
 * Middleware to verify CSRF token
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const validateCsrfToken = (req: Request, res: Response, next: NextFunction): void => {
  // Skip validation for GET, HEAD, OPTIONS requests
  // These methods should be idempotent and not modify state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  try {
    // Get the CSRF token from header
    const csrfToken = req.headers['x-csrf-token'] as string;
    
    // Get user ID from the request
    const userId = req.user?.id;
    
    if (!csrfToken) {
      return res.status(403).json({
        success: false,
        message: 'CSRF token missing'
      });
    }
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if token exists and is valid
    const storedToken = csrfTokens[userId];
    
    if (!storedToken || storedToken.token !== csrfToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid CSRF token'
      });
    }
    
    // Check if token has expired
    if (storedToken.expires < new Date()) {
      delete csrfTokens[userId];
      return res.status(403).json({
        success: false,
        message: 'CSRF token expired'
      });
    }
    
    // Token is valid, proceed
    next();
  } catch (error) {
    logger.error('CSRF validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during CSRF validation'
    });
  }
};

/**
 * Generate a new CSRF token
 * @param {string} userId - User ID
 * @returns {string} - Generated CSRF token
 */
export const generateCsrfToken = (userId: string): string => {
  // Generate a random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Set expiration (24 hours from now)
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);
  
  // Store token
  csrfTokens[userId] = { token, expires };
  
  return token;
};

/**
 * Middleware to provide CSRF token
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const csrfTokenMiddleware = (req: Request, res: Response): void => {
  try {
    // Get user ID from the request
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Generate a new token
    const token = generateCsrfToken(userId);
    
    // Return token to client
    res.json({
      success: true,
      token
    });
  } catch (error) {
    logger.error('CSRF token generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate CSRF token'
    });
  }
};

export default {
  validateCsrfToken,
  generateCsrfToken,
  csrfTokenMiddleware
};