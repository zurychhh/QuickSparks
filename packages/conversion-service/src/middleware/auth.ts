import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

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
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Authorization header missing'
      });
      return;
    }
    
    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Invalid authorization format'
      });
      return;
    }
    
    // Extract the token
    const token = authHeader.substring(7);
    
    // In a real implementation, verify the token
    // For now, just use the token as a user ID for simplicity
    if (token in MOCK_USERS) {
      // Add user object to request
      req.user = MOCK_USERS[token];
      next();
    } else {
      // For testing, allow any token and create a test user
      logger.warn(`Using test user for token: ${token}`);
      req.user = {
        id: token || 'test-user',
        email: 'test@example.com',
        tier: 'free'
      };
      next();
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