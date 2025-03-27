import { Router } from 'express';
import paymentController from '../controllers/paymentController';
import auth from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/payments/initiate/:conversionId
 * @desc    Initiate a payment for a conversion
 * @access  Private
 */
router.post('/initiate/:conversionId', auth, paymentController.initiatePayment);

/**
 * @route   GET /api/payments/status/:conversionId
 * @desc    Get payment status for a conversion
 * @access  Private
 */
router.get('/status/:conversionId', auth, paymentController.getPaymentStatus);

/**
 * @route   POST /api/payments/notify
 * @desc    Handle payment notifications from PayByLink
 * @access  Public (secured by signature verification)
 */
router.post('/notify', paymentController.handlePaymentNotification);

/**
 * @route   GET /api/payments/internal/status/:conversionId
 * @desc    Internal API to verify payment status (used by other services)
 * @access  Private (secured by internal API key)
 */
router.get('/internal/status/:conversionId', paymentController.verifyPaymentInternal);

export default router;