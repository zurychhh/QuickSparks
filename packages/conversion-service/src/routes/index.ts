import express from 'express';
import conversionRoutes from './conversion.routes';
import healthRoutes from './health.routes';
import thumbnailRoutes from './thumbnail.routes';
import downloadRoutes from './download.routes';
import paymentRoutes from './payment.routes';
import authRoutes from './auth.routes';
import debugRoutes from './debug.routes';
import rateLimiter from '../middleware/rateLimiter';
import { validateCsrfToken } from '../middleware/csrf';

const router = express.Router();

// Apply dynamic rate limiter to all API routes except health checks
router.use(rateLimiter.apiLimiter);

// Health check routes - no rate limiting for monitoring
router.use('/health', healthRoutes);

// Auth routes - CSRF protection not needed on login/status endpoints
router.use('/auth', authRoutes);

// Apply CSRF protection to all routes that modify state
// This should come after the rate limiter but before the route handlers
router.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return validateCsrfToken(req, res, next);
  }
  next();
});

// Conversion routes with stricter upload rate limiting for certain endpoints
router.use('/conversions', (req, res, next) => {
  // Apply stricter rate limiting to file upload endpoints
  if (req.path.includes('/upload') && req.method === 'POST') {
    return rateLimiter.uploadLimiter(req, res, next);
  }
  next();
}, conversionRoutes);

// Thumbnail routes
router.use('/thumbnails', thumbnailRoutes);

// Download routes
router.use('/downloads', downloadRoutes);

// Payment routes - uses standard api limiter
router.use('/payments', paymentRoutes);

// Debug routes - only available in non-production environments
if (process.env.NODE_ENV !== 'production') {
  console.log('Debug routes enabled for remote logging');
  router.use('/debug', debugRoutes);
} else {
  // In production, still enable the routes but with stricter security
  console.log('Debug routes enabled with production security');
  // Apply special middleware for production to check for debug secret
  router.use('/debug', (req, res, next) => {
    const debugSecret = process.env.DEBUG_SECRET;
    if (!debugSecret || req.headers['x-debug-secret'] !== debugSecret) {
      return res.status(404).json({
        success: false,
        message: 'Not found'
      });
    }
    next();
  }, debugRoutes);
}

export default router;