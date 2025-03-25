import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/errorHandler';
import User from '../models/user.model';
import env from '../config/env';

/**
 * JWT payload interface
 */
interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

/**
 * Extend Express Request interface to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from request header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Authentication required. Please log in.', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new ApiError('Invalid authentication token', 401);
    }
    
    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    
    // Find user by ID
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      throw new ApiError('User not found', 401);
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication middleware
 * Verifies JWT token if present, but doesn't require it
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from request header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }
    
    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    
    // Find user by ID
    const user = await User.findById(decoded.id).select('-password');
    
    if (user) {
      // Attach user to request object
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Just continue if token is invalid or expired
    next();
  }
};