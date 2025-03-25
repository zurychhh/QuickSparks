import express from 'express';
import paymentRoutes from './payment.routes';
import webhookRoutes from './webhook.routes';
import healthRoutes from './health.routes';

const router = express.Router();

// Health check routes
router.use('/health', healthRoutes);

// Payment routes
router.use('/payments', paymentRoutes);

// Webhook routes
router.use('/webhooks/stripe', webhookRoutes);

export default router;