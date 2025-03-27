/**
 * 16-API_ROUTES.js
 * 
 * This file contains API routes definitions for the backend.
 */

// Health Check Route
// ==============
// packages/conversion-service/src/routes/health.routes.ts
const healthRoutes = `
import { Router } from 'express';
import { env } from '../config/env';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint to verify API status
 */
router.get('/', (req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
    },
    version: process.env.npm_package_version || 'unknown',
  });
});

export default router;
`;

// Payment Routes
// ===========
// packages/conversion-service/src/routes/payment.routes.ts
const paymentRoutes = `
import { Router } from 'express';
import paymentController from '../controllers/paymentController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateRequest, paymentWebhookSchema } from '../middleware/validation';
import express from 'express';

const router = Router();

/**
 * POST /api/payment/create-checkout
 * Create a Stripe checkout session for a conversion
 */
router.post(
  '/create-checkout',
  optionalAuth,
  paymentController.createCheckout
);

/**
 * POST /api/payment/webhook
 * Handle webhook events from Stripe
 * Note: This needs raw body for signature verification
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  validateRequest(paymentWebhookSchema),
  paymentController.handleWebhook
);

/**
 * GET /api/payment/verify/:conversionId
 * Verify payment status for a conversion
 */
router.get(
  '/verify/:conversionId',
  optionalAuth,
  paymentController.verifyPayment
);

/**
 * GET /api/payment/subscriptions
 * Get subscriptions for the authenticated user
 */
router.get(
  '/subscriptions',
  authenticate,
  (req, res) => {
    // This would be implemented in a more complete version
    res.status(200).json({
      subscriptions: []
    });
  }
);

export default router;
`;

// Thumbnail Routes
// ============
// packages/conversion-service/src/routes/thumbnail.routes.ts
const thumbnailRoutes = `
import { Router } from 'express';
import thumbnailController from '../controllers/thumbnailController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/thumbnails/:id
 * Get thumbnail for a document
 */
router.get(
  '/:id',
  optionalAuth,
  thumbnailController.getThumbnail
);

/**
 * GET /api/thumbnails/secure/:token
 * Get thumbnail via secure token
 */
router.get(
  '/secure/:token',
  thumbnailController.getThumbnailByToken
);

export default router;
`;

// All API Routes (Combined)
// =====================
// packages/conversion-service/src/routes/index.ts
const combinedRoutes = `
import { Router } from 'express';
import conversionRoutes from './conversion.routes';
import downloadRoutes from './download.routes';
import paymentRoutes from './payment.routes';
import thumbnailRoutes from './thumbnail.routes';
import healthRoutes from './health.routes';
import { notFoundHandler } from '../middleware/errorHandler';

const router = Router();

// Mount sub-routes
router.use('/conversion', conversionRoutes);
router.use('/download', downloadRoutes);
router.use('/payment', paymentRoutes);
router.use('/thumbnails', thumbnailRoutes);
router.use('/health', healthRoutes);

// API documentation route
router.get('/docs', (req, res) => {
  res.redirect('https://pdfspark.docs.apiary.io');
});

// Handle 404 for any other API routes
router.use('*', notFoundHandler);

export default router;
`;

// Conversion Routes
// =============
// packages/conversion-service/src/routes/conversion.routes.ts
const fullConversionRoutes = `
import { Router } from 'express';
import { uploadMiddleware, handleFileUploadErrors } from '../middleware/fileUpload';
import conversionController from '../controllers/conversionController';
import { optionalAuth, authenticate } from '../middleware/auth';
import { validateRequest, conversionSchema } from '../middleware/validation';

const router = Router();

/**
 * POST /api/conversion
 * Upload a file and start conversion
 */
router.post(
  '/',
  optionalAuth, // Auth is optional to allow anonymous conversions
  uploadMiddleware.single('file'),
  handleFileUploadErrors,
  validateRequest(conversionSchema),
  conversionController.startConversion
);

/**
 * GET /api/conversion/:id
 * Get conversion status
 */
router.get(
  '/:id',
  optionalAuth,
  conversionController.getConversionStatus
);

/**
 * DELETE /api/conversion/:id
 * Cancel conversion
 */
router.delete(
  '/:id',
  optionalAuth,
  conversionController.cancelConversion
);

/**
 * GET /api/conversion/history
 * Get conversion history for authenticated user
 */
router.get(
  '/history',
  authenticate, // Authentication required
  async (req, res, next) => {
    try {
      // This would be implemented in a more complete version
      // to return the user's conversion history
      res.status(200).json({
        conversions: []
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
`;

// Download Routes
// ===========
// packages/conversion-service/src/routes/download.routes.ts
const fullDownloadRoutes = `
import { Router } from 'express';
import downloadController from '../controllers/downloadController';
import thumbnailController from '../controllers/thumbnailController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/download/:token
 * Download converted file using secure token
 */
router.get(
  '/:token',
  optionalAuth,
  downloadController.downloadFile
);

/**
 * GET /api/download/status/:token
 * Check if a download is available
 */
router.get(
  '/status/:token',
  optionalAuth,
  downloadController.checkDownload
);

/**
 * GET /api/download/thumbnail/:id
 * Get thumbnail for a conversion
 */
router.get(
  '/thumbnail/:id',
  optionalAuth,
  thumbnailController.getThumbnail
);

/**
 * GET /api/download/thumbnail/secure/:token
 * Get thumbnail via secure token
 */
router.get(
  '/thumbnail/secure/:token',
  thumbnailController.getThumbnailByToken
);

export default router;
`;