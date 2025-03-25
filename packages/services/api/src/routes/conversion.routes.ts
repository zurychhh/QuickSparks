import express from 'express';
import {
  startConversion,
  getConversionStatus,
  getConversionHistory,
  downloadConvertedFile,
} from '../controllers/conversion.controller';
import { validate } from '../middleware/validation';
import { startConversionSchema, getConversionStatusSchema, listConversionsSchema } from '../schemas/conversion.schema';
import { authMiddleware } from '../middleware/auth';
import { conversionRateLimit } from '../middleware/rateLimit';

const router = express.Router();

/**
 * Conversion Routes
 */

// Start a new conversion
router.post('/', authMiddleware, conversionRateLimit, validate(startConversionSchema), startConversion);

// Get conversion status
router.get('/:id', authMiddleware, validate(getConversionStatusSchema), getConversionStatus);

// Get conversion history
router.get('/history', authMiddleware, validate(listConversionsSchema), getConversionHistory);

// Download converted file
router.get('/download/:id', authMiddleware, validate(getConversionStatusSchema), downloadConvertedFile);

export default router;