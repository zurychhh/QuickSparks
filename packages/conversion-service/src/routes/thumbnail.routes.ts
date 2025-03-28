import express from 'express';
import thumbnailController from '../controllers/thumbnailController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Generate thumbnail for a file
router.post(
  '/generate/:fileId',
  thumbnailController.generateThumbnail
);

// Generate thumbnail for a conversion result
router.post(
  '/conversion/:id',
  thumbnailController.generateConversionThumbnail
);

// Get a thumbnail by ID
router.get(
  '/:id',
  thumbnailController.getThumbnail
);

export default router;