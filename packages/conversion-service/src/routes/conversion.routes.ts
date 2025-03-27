import express from 'express';
import conversionController from '../controllers/conversionController';
import { authMiddleware, requireTier } from '../middleware/auth';
import { fileUploadMiddleware } from '../middleware/fileUpload';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Upload and convert
router.post(
  '/upload',
  fileUploadMiddleware('file'),
  conversionController.uploadAndConvert
);

// Start a conversion with existing file
router.post(
  '/',
  conversionController.startConversion
);

// Get conversion status
router.get(
  '/:id',
  conversionController.getConversionStatus
);

// Cancel a conversion
router.delete(
  '/:id',
  conversionController.cancelConversion
);

// Get user's conversion history
router.get(
  '/',
  conversionController.getUserConversions
);

// Download converted file
router.get(
  '/:id/download',
  conversionController.downloadConvertedFile
);

// High quality conversions (premium feature)
router.post(
  '/high-quality',
  requireTier(['premium', 'enterprise']),
  fileUploadMiddleware('file'),
  conversionController.uploadAndConvert
);

export default router;