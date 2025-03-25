import express from 'express';
import conversionRoutes from './conversion.routes';
import healthRoutes from './health.routes';

const router = express.Router();

// Health check routes
router.use('/health', healthRoutes);

// Conversion routes
router.use('/conversions', conversionRoutes);

export default router;