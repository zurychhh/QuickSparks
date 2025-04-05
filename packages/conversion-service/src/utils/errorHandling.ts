import { Request, Response, NextFunction } from 'express';
import logger from './logger';

/**
 * Safely extracts error message from any error type
 * @param {unknown} error - The error to extract message from
 * @returns {string} - Error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else if (error && typeof error === 'object' && 'message' in error &&
      typeof (error as Record<string, unknown>).message === 'string') {
    return (error as { message: string }).message;
  } else {
    return 'Unknown error occurred';
  }
};

/**
 * Safely handles errors in async route handlers
 * @param {Function} fn - Async route handler
 * @returns {Function} - Error-handled route handler
 */
export const asyncHandler = (fn: Function) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      logger.error('API Error:', error);

      if (!res.headersSent) {
        res.status(500).json({
          error: 'INTERNAL_SERVER_ERROR',
          message: getErrorMessage(error)
        });
      } else {
        // Log error if headers already sent
        logger.error('Error occurred after response headers sent:', error);
      }
    });
  };

/**
 * Middleware to handle streaming errors
 */
export const streamErrorHandler = (
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // If headers already sent, log the error and end the response
  if (res.headersSent) {
    logger.error('Error occurred after response headers sent:', err);
    res.end();
    return;
  }

  // Otherwise, pass to regular error handler
  next(err);
};