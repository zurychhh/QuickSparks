import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import env from '../config/env';

// Auth token types
interface AuthTokenPayload {
  userId: string;
  email: string;
  tier: string;
  exp?: number;
}

// Mock user data for development
const MOCK_USERS = {
  'test-user': {
    id: 'test-user',
    email: 'test@example.com',
    tier: 'free'
  },
  'premium-user': {
    id: 'premium-user',
    email: 'premium@example.com',
    tier: 'premium'
  }
};

// In a real implementation, this would validate the token against a database or auth service
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get the token from cookies instead of headers
    const token = req.cookies.auth_token;
    
    // If no cookie present, fall back to authorization header (for API clients)
    const authHeader = !token ? req.headers.authorization : null;
    let extractedToken = token;
    
    // Process Authorization header if no cookie present
    if (!token && authHeader) {
      if (!authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'Invalid authorization format'
        });
        return;
      }
      extractedToken = authHeader.substring(7);
    }
    
    // If no token found in either cookie or header
    if (!extractedToken) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }
    
    // Check if we're in development mode
    const isDevelopment = env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      // In development, use mock users for testing
      // In a real implementation, verify the token using JWT
      if (extractedToken in MOCK_USERS) {
        // Add user object to request
        req.user = MOCK_USERS[extractedToken];
        next();
      } else {
        // For testing, allow any token and create a test user
        logger.warn(`Using test user for token: ${extractedToken}`);
        req.user = {
          id: extractedToken || 'test-user',
          email: 'test@example.com',
          tier: 'free'
        };
        next();
      }
    } else {
      // In production, verify JWT token
      try {
        // Verify token and extract payload
        const secret = env.JWT_SECRET || 'default-secret-replace-in-production';
        const decoded = jwt.verify(extractedToken, secret) as AuthTokenPayload;
        
        // Add user object to request
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          tier: decoded.tier
        };
        
        next();
      } catch (jwtError) {
        logger.error('JWT verification failed', jwtError);
        res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
    }
  } catch (error) {
    logger.error('Auth middleware error', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Middleware to check for specific user tiers
export const requireTier = (requiredTiers: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }
    
    if (requiredTiers.includes(req.user.tier)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Subscription upgrade required for this feature'
      });
    }
  };
};

export default {
  authMiddleware,
  requireTier
};