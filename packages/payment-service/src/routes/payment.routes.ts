import express from 'express';
import paymentController from '../controllers/paymentController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes except webhook
router.use(authMiddleware);

// Create checkout session for one-time payment
router.post('/checkout', paymentController.createCheckoutSession);

// Get payment status for a conversion
router.get('/status/:conversionId', paymentController.getPaymentStatus);

// Get payment history
router.get('/history', paymentController.getPaymentHistory);

// Get product information
router.get('/product-info', paymentController.getProductInfo);

// Legacy routes - keeping for reference but these won't be used
router.get('/subscription', (req, res) => res.status(410).json({ success: false, message: 'Subscription model has been deprecated' }));
router.post('/subscription/cancel', (req, res) => res.status(410).json({ success: false, message: 'Subscription model has been deprecated' }));
router.post('/portal', (req, res) => res.status(410).json({ success: false, message: 'Subscription model has been deprecated' }));

export default router;