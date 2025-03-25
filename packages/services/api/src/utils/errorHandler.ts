import { Request, Response, NextFunction } from 'express';
import env from '../config/env';

/**
 * Error response interface
 */
interface ErrorResponse {
  status: string;
  message: string;
  stack?: string;
  errors?: Record<string, string[]>;
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(message: string, statusCode: number, errors?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error handler
 * Handles 404 errors for routes that don't exist
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new ApiError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Global Error handler
 * Central error handling middleware
 */
export const errorHandler = (
  err: ApiError | Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): Response => {
  // Default status code and error message
  const statusCode = 'statusCode' in err ? err.statusCode : 500;
  
  const errorResponse: ErrorResponse = {
    status: 'error',
    message: err.message || 'Internal Server Error',
  };
  
  // Add validation errors if present
  if ('errors' in err && err.errors) {
    errorResponse.errors = err.errors;
  }
  
  // Add stack trace in development
  if (env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }
  
  // Log errors
  console.error(`[${new Date().toISOString()}] ${err.stack || err}`);
  
  return res.status(statusCode).json(errorResponse);
};