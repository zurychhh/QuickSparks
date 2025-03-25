import Stripe from 'stripe';
import env from '../config/env';
import logger from '../utils/logger';

// Initialize Stripe with secret key
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use the latest stable API version
});

/**
 * Create a Stripe checkout session for one-time payment
 */
export const createCheckoutSession = async ({
  conversionId,
  userId,
  email,
  successUrl = `${env.FRONTEND_URL}/payment/success`,
  cancelUrl = `${env.FRONTEND_URL}/convert`,
  customerDetails = {},
  metadata = {}
}: {
  conversionId: string;
  userId: string;
  email: string;
  successUrl?: string;
  cancelUrl?: string;
  customerDetails?: Record<string, any>;
  metadata?: Record<string, any>;
}): Promise<Stripe.Checkout.Session> => {
  try {
    // Create the checkout session with Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        userId,
        conversionId,
        ...metadata
      },
      payment_intent_data: {
        metadata: {
          userId,
          conversionId,
          ...metadata
        }
      }
    });

    logger.info(`Checkout session created: ${session.id}`);
    return session;
  } catch (error) {
    logger.error('Error creating checkout session', error);
    throw error;
  }
};

/**
 * Retrieve a Stripe checkout session
 */
export const getCheckoutSession = async (sessionId: string): Promise<Stripe.Checkout.Session> => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer', 'payment_intent']
    });
    return session;
  } catch (error) {
    logger.error(`Error retrieving checkout session: ${sessionId}`, error);
    throw error;
  }
};

/**
 * Get payment intent details
 */
export const getPaymentIntent = async (paymentIntentId: string): Promise<Stripe.PaymentIntent> => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['customer', 'payment_method']
    });
    return paymentIntent;
  } catch (error) {
    logger.error(`Error retrieving payment intent: ${paymentIntentId}`, error);
    throw error;
  }
};

/**
 * Verify Stripe webhook signature
 */
export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string
): Stripe.Event => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    logger.error('Webhook signature verification failed', error);
    throw error;
  }
};

/**
 * Refund a payment
 */
export const createRefund = async (
  paymentIntentId: string,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'abandoned'
): Promise<Stripe.Refund> => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason
    });
    logger.info(`Refund created for payment intent: ${paymentIntentId}`);
    return refund;
  } catch (error) {
    logger.error(`Error creating refund for payment intent: ${paymentIntentId}`, error);
    throw error;
  }
};

/**
 * Get Stripe customer
 */
export const getCustomer = async (customerId: string): Promise<Stripe.Customer> => {
  try {
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    return customer;
  } catch (error) {
    logger.error(`Error retrieving customer: ${customerId}`, error);
    throw error;
  }
};

/**
 * Create or update a customer
 */
export const createOrUpdateCustomer = async (
  userId: string,
  email: string,
  existingCustomerId?: string
): Promise<Stripe.Customer> => {
  try {
    if (existingCustomerId) {
      // Update existing customer
      const customer = await stripe.customers.update(existingCustomerId, {
        email,
        metadata: { userId }
      });
      return customer;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email,
        metadata: { userId }
      });
      return customer;
    }
  } catch (error) {
    logger.error(`Error creating/updating customer for user: ${userId}`, error);
    throw error;
  }
};

/**
 * Get product information
 */
export const getProduct = async (): Promise<Stripe.Product> => {
  try {
    const product = await stripe.products.retrieve(env.STRIPE_PRODUCT_ID);
    return product;
  } catch (error) {
    logger.error(`Error retrieving product: ${env.STRIPE_PRODUCT_ID}`, error);
    throw error;
  }
};

/**
 * Get price information
 */
export const getPrice = async (): Promise<Stripe.Price> => {
  try {
    const price = await stripe.prices.retrieve(env.STRIPE_PRICE_ID, {
      expand: ['product']
    });
    return price;
  } catch (error) {
    logger.error(`Error retrieving price: ${env.STRIPE_PRICE_ID}`, error);
    throw error;
  }
};

export default {
  createCheckoutSession,
  getCheckoutSession,
  getPaymentIntent,
  verifyWebhookSignature,
  createRefund,
  getCustomer,
  createOrUpdateCustomer,
  getProduct,
  getPrice
};