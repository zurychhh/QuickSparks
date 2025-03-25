import express from 'express';

const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'payment-service',
    timestamp: new Date().toISOString()
  });
});

// Detailed status check
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;