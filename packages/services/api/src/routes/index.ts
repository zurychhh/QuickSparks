import express from 'express';
import authRoutes from './auth.routes';
import conversionRoutes from './conversion.routes';

const router = express.Router();

/**
 * API Routes
 */

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
router.use('/auth', authRoutes);

// Conversion routes
router.use('/convert', conversionRoutes);

export default router;