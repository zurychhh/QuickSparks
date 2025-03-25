import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * @route GET /api/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/', async (req: Request, res: Response) => {
  const healthcheck = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    service: 'pdfspark-api',
    version: process.env.npm_package_version || '0.1.0',
  };

  res.status(200).json(healthcheck);
});

export default router;