import compression from 'compression';
import { Request, Response } from 'express';

/**
 * Compression middleware
 * Compresses HTTP responses to improve performance
 */
const compressionMiddleware = compression({
  // Only compress responses larger than 1KB
  threshold: 1024,
  
  // Skip compression for certain responses
  filter: (req: Request, res: Response): boolean => {
    // Don't compress responses with Content-Type image/*
    if (res.getHeader('Content-Type') && 
        (res.getHeader('Content-Type') as string).includes('image/')) {
      return false;
    }
    
    // Skip compression for already compressed resources
    if (res.getHeader('Content-Encoding')) {
      return false;
    }
    
    // Use compression filter defaults for other cases
    return compression.filter(req, res);
  },
  
  // Compression level (1-9, where 9 is highest compression but slowest)
  level: 6,
});

export default compressionMiddleware;