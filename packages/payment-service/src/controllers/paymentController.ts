import { Request, Response } from 'express';
import paymentService from '../services/paymentService';
import logger from '../utils/logger';

/**
 * Create a checkout session for a conversion payment
 */
export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversionId, successUrl, cancelUrl } = req.body;
    
    // Get user ID from authenticated request
    const userId = req.user?.id;
    const email = req.user?.email;
    
    if (!userId || !email) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }
    
    // Validate conversion ID
    if (!conversionId) {
      res.status(400).json({
        success: false,
        message: 'Conversion ID is required'
      });
      return;
    }
    
    // Check if payment already exists for this conversion
    const existingPayment = await paymentService.checkPaymentForConversion(conversionId);
    if (existingPayment) {
      res.status(400).json({
        success: false,
        message: 'Payment already exists for this conversion'
      });
      return;
    }
    
    // Create checkout session
    const result = await paymentService.createPaymentCheckout({
      userId,
      email,
      conversionId,
      successUrl,
      cancelUrl
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error creating checkout session', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get payment status for a conversion
 */
export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversionId } = req.params;
    
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }
    
    if (!conversionId) {
      res.status(400).json({
        success: false,
        message: 'Conversion ID is required'
      });
      return;
    }
    
    const payment = await paymentService.getPaymentForConversion(conversionId);
    
    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment not found for this conversion'
      });
      return;
    }
    
    // Verify the payment belongs to the user
    if (payment.userId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to access this payment'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: {
        status: payment.status,
        isPaid: payment.status === 'completed',
        amount: payment.amount,
        currency: payment.currency,
        createdAt: payment.createdAt
      }
    });
  } catch (error) {
    logger.error(`Error getting payment status: ${req.params.conversionId}`, error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get payment history for the current user
 */
export const getPaymentHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await paymentService.getUserPaymentHistory(userId, limit, page);
    
    res.status(200).json({
      success: true,
      data: result.payments,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    logger.error(`Error getting payment history for user: ${req.user?.id}`, error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get product information
 */
export const getProductInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const productInfo = await paymentService.getProductInfo();
    
    res.status(200).json({
      success: true,
      data: productInfo
    });
  } catch (error) {
    logger.error('Error getting product information', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get product information',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export default {
  createCheckoutSession,
  getPaymentStatus,
  getPaymentHistory,
  getProductInfo
};