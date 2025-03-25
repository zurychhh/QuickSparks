import Stripe from 'stripe';
import stripeService from './stripeService';
import paymentService from './paymentService';
import Payment, { PaymentStatus } from '../models/payment.model';
import logger from '../utils/logger';

/**
 * Process Stripe webhook events
 */
export const processWebhookEvent = async (event: Stripe.Event): Promise<void> => {
  const eventType = event.type;
  
  logger.info(`Processing webhook event: ${eventType} [${event.id}]`);
  
  try {
    switch (eventType) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      default:
        logger.info(`Unhandled webhook event type: ${eventType}`);
    }
  } catch (error) {
    logger.error(`Error processing webhook event: ${eventType} [${event.id}]`, error);
    throw error;
  }
};

/**
 * Handle checkout.session.completed event
 */
const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session): Promise<void> => {
  try {
    // For one-time payments
    if (session.mode === 'payment' && session.payment_intent) {
      logger.info(`Checkout session completed: ${session.id}, payment intent: ${session.payment_intent}`);
      
      // The payment_intent.succeeded event will handle updating the payment record
      // This is just a confirmation that the checkout process is complete
    }
  } catch (error) {
    logger.error(`Error handling checkout session completed: ${session.id}`, error);
    throw error;
  }
};

/**
 * Handle payment_intent.succeeded event
 */
const handlePaymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent): Promise<void> => {
  try {
    const paymentIntentId = paymentIntent.id;
    
    // Process the successful payment
    await paymentService.processSuccessfulPayment(paymentIntentId);
    
    logger.info(`Payment intent succeeded: ${paymentIntentId}`);
    
  } catch (error) {
    logger.error(`Error handling payment intent succeeded: ${paymentIntent.id}`, error);
    throw error;
  }
};

/**
 * Handle payment_intent.payment_failed event
 */
const handlePaymentIntentFailed = async (paymentIntent: Stripe.PaymentIntent): Promise<void> => {
  try {
    const userId = paymentIntent.metadata?.userId;
    const conversionId = paymentIntent.metadata?.conversionId;
    
    if (!userId) {
      logger.warn(`Payment intent failed without userId metadata: ${paymentIntent.id}`);
      return;
    }
    
    // Find the payment record
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
    
    if (payment) {
      // Update the payment status
      payment.status = 'failed';
      await payment.save();
    } else {
      // Create a new payment record if it doesn't exist
      await Payment.create({
        userId,
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents to dollars
        currency: paymentIntent.currency,
        status: 'failed',
        conversionId,
        metadata: {
          ...paymentIntent.metadata,
          error: paymentIntent.last_payment_error?.message
        }
      });
    }
    
    logger.info(`Payment intent failed: ${paymentIntent.id}, reason: ${paymentIntent.last_payment_error?.message || 'unknown'}`);
    
  } catch (error) {
    logger.error(`Error handling payment intent failed: ${paymentIntent.id}`, error);
    throw error;
  }
};

export default {
  processWebhookEvent
};