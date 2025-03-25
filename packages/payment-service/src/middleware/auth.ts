import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

// Define the structure of user data in JWTs
interface JwtPayload {
  id: string;
  email: string;
  role?: string;
  tier?: string;
}

// JWT secret (should be loaded from environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_key_for_development';

/**
 * Middleware to authenticate users via JWT token
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Add user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'user',
      tier: decoded.tier || 'free'
    };
    
    next();
  } catch (error) {
    logger.error('Authentication error', error);
    
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Middleware to restrict access based on user role
 */
export const requireRole = (roles: string[]): (req: Request, res: Response, next: NextFunction) => void => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }
    
    next();
  };
};

/**
 * Middleware to restrict access based on subscription tier
 */
export const requireTier = (tiers: string[]): (req: Request, res: Response, next: NextFunction) => void => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }
    
    if (!tiers.includes(req.user.tier)) {
      res.status(403).json({
        success: false,
        message: 'Subscription upgrade required'
      });
      return;
    }
    
    next();
  };
};

// Extend Express Request type definition
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        tier: string;
      };
    }
  }
}

export default {
  authMiddleware,
  requireRole,
  requireTier
};