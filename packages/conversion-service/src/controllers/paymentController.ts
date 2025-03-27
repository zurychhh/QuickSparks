import { Request, Response } from 'express';
import Conversion from '../models/conversion.model';
import Payment from '../models/payment.model';
import paymentService from '../services/paymentService';
import notificationService from '../services/notificationService';
import logger from '../utils/logger';
import env from '../config/env';
import { PaymentRequest, PaymentNotification } from '../types/conversion';

/**
 * Initiate a payment for a conversion
 */
export async function initiatePayment(req: Request, res: Response): Promise<void> {
  try {
    const { conversionId } = req.params;
    const userId = req.user!.id;
    
    // Check if conversion exists and belongs to user
    const conversion = await Conversion.findById(conversionId);
    
    if (!conversion) {
      res.status(404).json({
        success: false,
        message: 'Conversion not found'
      });
      return;
    }
    
    // Check if conversion belongs to user
    if (conversion.userId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }
    
    // Check if conversion is completed
    if (conversion.status !== 'completed') {
      res.status(400).json({
        success: false,
        message: 'Conversion must be completed before payment'
      });
      return;
    }
    
    // Check if payment already exists for this conversion
    const existingPayment = await Payment.findOne({
      conversionId,
      userId
    });
    
    // If payment exists and is completed, return success
    if (existingPayment && existingPayment.status === 'completed') {
      res.status(200).json({
        success: true,
        message: 'Payment already completed',
        data: {
          paymentId: existingPayment._id,
          status: existingPayment.status
        }
      });
      return;
    }
    
    // If payment exists but not completed, return existing payment URL
    if (existingPayment && existingPayment.status !== 'failed') {
      res.status(200).json({
        success: true,
        message: 'Payment already initiated',
        data: {
          paymentId: existingPayment._id,
          paymentUrl: existingPayment.paymentUrl,
          status: existingPayment.status
        }
      });
      return;
    }
    
    // Determine conversion price based on conversion type
    const amount = conversion.conversionType === 'pdf-to-docx' 
      ? env.PDF_TO_DOCX_PRICE 
      : env.DOCX_TO_PDF_PRICE;
    
    // Prepare success and cancel URLs from request or use defaults
    const successUrl = req.body.successUrl || `${env.BASE_URL}/payment/success/${conversionId}`;
    const cancelUrl = req.body.cancelUrl || `${env.BASE_URL}/payment/cancel/${conversionId}`;
    
    // Prepare payment request
    const paymentRequest: PaymentRequest = {
      conversionId,
      userId,
      amount,
      currency: env.DEFAULT_PAYMENT_CURRENCY,
      description: `Payment for ${conversion.conversionType} conversion`,
      successUrl,
      cancelUrl,
      metaData: {
        conversionType: conversion.conversionType,
        pageCount: conversion.pageCount
      }
    };
    
    // Create payment
    const paymentResponse = await paymentService.createPayment(paymentRequest);
    
    if (paymentResponse.success) {
      // Return payment details
      res.status(200).json({
        success: true,
        data: {
          paymentId: paymentResponse.paymentId,
          paymentUrl: paymentResponse.paymentUrl,
          amount,
          currency: env.DEFAULT_PAYMENT_CURRENCY
        }
      });
      
      // Notify user that payment has been created
      notificationService.sendPaymentStatusNotification(
        userId,
        conversionId,
        'pending',
        {
          paymentId: paymentResponse.paymentId,
          paymentUrl: paymentResponse.paymentUrl
        }
      );
    } else {
      res.status(500).json({
        success: false,
        message: paymentResponse.error || 'Failed to create payment'
      });
    }
  } catch (error) {
    logger.error('Payment initiation error', error);
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to initiate payment'
    });
  }
}

/**
 * Get payment status for a conversion
 */
export async function getPaymentStatus(req: Request, res: Response): Promise<void> {
  try {
    const { conversionId } = req.params;
    const userId = req.user!.id;
    
    // Get payment status
    const { isPaid, payment } = await paymentService.getPaymentStatus(conversionId, userId);
    
    res.status(200).json({
      success: true,
      data: {
        isPaid,
        payment
      }
    });
  } catch (error) {
    logger.error('Get payment status error', error);
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get payment status'
    });
  }
}

/**
 * Handle payment notifications from PayByLink
 */
export async function handlePaymentNotification(req: Request, res: Response): Promise<void> {
  try {
    // Get notification data from request
    const notificationData = req.body;
    
    // Get signature from headers
    const signature = req.headers['x-signature'] as string;
    
    if (!signature) {
      logger.warn('Payment notification received without signature');
      res.status(400).json({
        success: false,
        message: 'Missing signature'
      });
      return;
    }
    
    // Process notification
    const success = await paymentService.processNotification(notificationData, signature);
    
    if (success) {
      // If notification processing was successful, extract information from notification
      const paymentId = notificationData.control;
      
      // Find payment in database
      const payment = await Payment.findOne({ paymentId });
      
      if (payment) {
        // Get conversion and send notification to user
        const conversionId = payment.conversionId.toString();
        const userId = payment.userId;
        
        // Send notification to user about payment status
        notificationService.sendPaymentStatusNotification(
          userId,
          conversionId,
          payment.status,
          {
            paymentId,
            transactionId: notificationData.transactionId
          }
        );
      }
      
      // Return success response
      res.status(200).json({
        success: true
      });
    } else {
      // Return error response
      res.status(400).json({
        success: false,
        message: 'Invalid notification'
      });
    }
  } catch (error) {
    logger.error('Payment notification handling error', error);
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process payment notification'
    });
  }
}

/**
 * Internal API to verify payment status (used by other services)
 */
export async function verifyPaymentInternal(req: Request, res: Response): Promise<void> {
  try {
    const { conversionId } = req.params;
    const userId = req.headers['user-id'] as string;
    
    // Verify internal API key
    const apiKey = req.headers.authorization?.split(' ')[1];
    
    if (apiKey !== env.INTERNAL_API_KEY) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }
    
    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }
    
    // Check if payment is required
    if (!env.PAYMENT_REQUIRED) {
      res.status(200).json({
        success: true,
        data: {
          isPaid: true,
          reason: 'Payment not required'
        }
      });
      return;
    }
    
    // Get payment status
    const { isPaid, payment } = await paymentService.getPaymentStatus(conversionId, userId);
    
    res.status(200).json({
      success: true,
      data: {
        isPaid,
        payment
      }
    });
  } catch (error) {
    logger.error('Internal payment verification error', error);
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to verify payment'
    });
  }
}

export default {
  initiatePayment,
  getPaymentStatus,
  handlePaymentNotification,
  verifyPaymentInternal
};