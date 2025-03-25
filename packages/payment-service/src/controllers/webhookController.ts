import { Request, Response } from 'express';
import stripeService from '../services/stripeService';
import webhookService from '../services/webhookService';
import logger from '../utils/logger';

/**
 * Handle Stripe webhook events
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      res.status(400).json({
        success: false,
        message: 'Missing Stripe signature'
      });
      return;
    }
    
    // Verify webhook signature
    const event = stripeService.verifyWebhookSignature(req.body, signature);
    
    // Process webhook event
    await webhookService.processWebhookEvent(event);
    
    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Webhook error', error);
    
    res.status(400).json({
      success: false,
      message: 'Webhook error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export default {
  handleWebhook
};