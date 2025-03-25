import express from 'express';
import conversionRoutes from './conversion.routes';
import healthRoutes from './health.routes';
import thumbnailRoutes from './thumbnail.routes';
import downloadRoutes from './download.routes';
import paymentRoutes from './payment.routes';

const router = express.Router();

// Health check routes
router.use('/health', healthRoutes);

// Conversion routes
router.use('/conversions', conversionRoutes);

// Thumbnail routes
router.use('/thumbnails', thumbnailRoutes);

// Download routes
router.use('/downloads', downloadRoutes);

// Payment routes
router.use('/payments', paymentRoutes);

export default router;