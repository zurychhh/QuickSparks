import express from 'express';
import authRoutes from './auth.routes';
import conversionRoutes from './conversion.routes';
import healthRoutes from './health.routes';

const router = express.Router();

/**
 * API Routes
 */

// Health check routes
router.use('/health', healthRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// Conversion routes
router.use('/convert', conversionRoutes);

export default router;