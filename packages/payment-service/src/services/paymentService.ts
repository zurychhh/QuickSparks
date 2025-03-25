import Payment, { PaymentStatus } from '../models/payment.model';
import stripeService from './stripeService';
import logger from '../utils/logger';

/**
 * Create a checkout session for one-time payment
 */
export const createPaymentCheckout = async ({
  userId,
  email,
  conversionId,
  successUrl,
  cancelUrl,
  metadata = {}
}: {
  userId: string;
  email: string;
  conversionId: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}): Promise<{ url: string; sessionId: string }> => {
  try {
    // Create checkout session
    const session = await stripeService.createCheckoutSession({
      conversionId,
      userId,
      email,
      successUrl,
      cancelUrl,
      metadata
    });
    
    // Create a pending payment record
    await Payment.create({
      userId,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      amount: 0, // Will be updated when payment is completed
      currency: 'usd',
      status: 'pending',
      conversionId,
      metadata: {
        ...metadata,
        sessionId: session.id
      }
    });
    
    return {
      url: session.url || '',
      sessionId: session.id
    };
  } catch (error) {
    logger.error('Error creating payment checkout session', error);
    throw new Error('Failed to create payment checkout session');
  }
};

/**
 * Process a successful payment
 */
export const processSuccessfulPayment = async (
  paymentIntentId: string
): Promise<{ payment: any }> => {
  try {
    // Get payment intent details from Stripe
    const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);
    
    if (!paymentIntent) {
      throw new Error(`Payment intent not found: ${paymentIntentId}`);
    }
    
    // Find or create payment record
    let payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    
    if (payment) {
      // Update existing payment
      payment.status = 'completed';
      payment.amount = paymentIntent.amount / 100; // Convert from cents to dollars
      payment.stripeCustomerId = paymentIntent.customer as string;
      await payment.save();
    } else {
      // Create new payment record if it doesn't exist
      // This should rarely happen as we create a pending payment when creating checkout
      const userId = paymentIntent.metadata?.userId;
      const conversionId = paymentIntent.metadata?.conversionId;
      
      if (!userId) {
        throw new Error(`Payment intent ${paymentIntentId} has no userId in metadata`);
      }
      
      payment = await Payment.create({
        userId,
        stripeCustomerId: paymentIntent.customer as string,
        stripePaymentIntentId: paymentIntentId,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: 'completed',
        conversionId,
        metadata: paymentIntent.metadata
      });
    }
    
    logger.info(`Processed successful payment: ${paymentIntentId}`);
    
    return {
      payment: payment.toObject()
    };
  } catch (error) {
    logger.error(`Error processing payment: ${paymentIntentId}`, error);
    throw error;
  }
};

/**
 * Check if payment exists for conversion
 */
export const checkPaymentForConversion = async (
  conversionId: string
): Promise<boolean> => {
  try {
    const payment = await Payment.findOne({
      conversionId,
      status: 'completed'
    });
    
    return !!payment;
  } catch (error) {
    logger.error(`Error checking payment for conversion: ${conversionId}`, error);
    throw error;
  }
};

/**
 * Get payment details for a conversion
 */
export const getPaymentForConversion = async (
  conversionId: string
): Promise<any | null> => {
  try {
    const payment = await Payment.findOne({
      conversionId
    }).lean();
    
    return payment;
  } catch (error) {
    logger.error(`Error getting payment for conversion: ${conversionId}`, error);
    throw error;
  }
};

/**
 * Get payment history for a user
 */
export const getUserPaymentHistory = async (
  userId: string, 
  limit: number = 10, 
  page: number = 1
): Promise<{ payments: any[]; total: number; page: number; totalPages: number }> => {
  try {
    const skip = (page - 1) * limit;
    
    const [payments, total] = await Promise.all([
      Payment.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments({ userId })
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      payments,
      total,
      page,
      totalPages
    };
  } catch (error) {
    logger.error(`Error getting payment history for user: ${userId}`, error);
    throw error;
  }
};

/**
 * Get product information
 */
export const getProductInfo = async (): Promise<any> => {
  try {
    const [product, price] = await Promise.all([
      stripeService.getProduct(),
      stripeService.getPrice()
    ]);
    
    return {
      product: {
        id: product.id,
        name: product.name,
        description: product.description
      },
      price: {
        id: price.id,
        amount: price.unit_amount ? price.unit_amount / 100 : 0,
        currency: price.currency
      }
    };
  } catch (error) {
    logger.error('Error getting product information', error);
    throw error;
  }
};

export default {
  createPaymentCheckout,
  processSuccessfulPayment,
  checkPaymentForConversion,
  getPaymentForConversion,
  getUserPaymentHistory,
  getProductInfo
};