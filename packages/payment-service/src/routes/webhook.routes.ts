import express from 'express';
import webhookController from '../controllers/webhookController';

const router = express.Router();

// Webhook endpoint doesn't use authentication middleware
// It uses Stripe signature verification instead
router.post('/', express.raw({ type: 'application/json' }), webhookController.handleWebhook);

export default router;