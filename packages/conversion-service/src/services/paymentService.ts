import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import Payment from '../models/payment.model';
import Conversion from '../models/conversion.model';
import logger from '../utils/logger';
import env from '../config/env';
import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentNotification } from '../types/conversion';

/**
 * Payment service to handle integration with PayByLink
 */
class PaymentService {
  private apiUrl: string;
  private secretKey: string;
  private shopId: string;
  private baseUrl: string;

  constructor() {
    this.apiUrl = `${env.PAYMENT_SERVICE_URL}/api`;
    this.secretKey = env.PAYMENT_SECRET_KEY || 'development-payment-secret';
    this.shopId = env.PAYMENT_SHOP_ID || 'development-shop';
    this.baseUrl = env.BASE_URL || 'http://localhost:5001';
  }

  /**
   * Generate a signature for PayByLink requests
   */
  private generateSignature(data: Record<string, any>): string {
    // Sort the keys alphabetically as required by PayByLink
    const sortedKeys = Object.keys(data).sort();
    
    // Create a string of key=value pairs
    const signatureBase = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&');
    
    // Generate SHA-256 hash with the secret key
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(signatureBase)
      .digest('hex');
  }

  /**
   * Verify signature from PayByLink notifications
   */
  public verifySignature(data: Record<string, any>, signature: string): boolean {
    const calculatedSignature = this.generateSignature(data);
    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  }

  /**
   * Create a payment request for a conversion
   */
  public async createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Generate a unique payment ID
      const paymentId = uuidv4();
      
      // Prepare notification and return URLs
      const notifyUrl = `${this.baseUrl}/api/payments/notify`;
      const successUrl = paymentData.successUrl;
      const failUrl = paymentData.cancelUrl;
      
      // Prepare PayByLink request data
      const payByLinkData = {
        shopId: this.shopId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        description: paymentData.description,
        control: paymentId, // Use our internal payment ID as the control field
        notifyURL: notifyUrl,
        returnUrlSuccess: successUrl,
        returnUrlFailed: failUrl,
        hiddenDescription: JSON.stringify({
          conversionId: paymentData.conversionId,
          userId: paymentData.userId
        })
      };
      
      // Add signature
      const signature = this.generateSignature(payByLinkData);
      payByLinkData['signature'] = signature;
      
      // Make API request to PayByLink
      const response = await axios.post(
        `${this.apiUrl}/transactions`,
        payByLinkData
      );
      
      // Process response from PayByLink
      if (response.data && response.data.success) {
        // Create payment record in database
        const payment = await Payment.create({
          conversionId: paymentData.conversionId,
          userId: paymentData.userId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: 'pending',
          provider: 'paybylink',
          paymentId: paymentId,
          paymentUrl: response.data.link,
          successUrl,
          cancelUrl: failUrl,
          metadata: paymentData.metaData,
          providerData: {
            transactionId: response.data.transactionId,
            link: response.data.link
          }
        });
        
        // Update conversion record with payment ID
        await Conversion.findByIdAndUpdate(
          paymentData.conversionId,
          { paymentId: payment._id }
        );
        
        logger.info(`Payment created successfully for conversion ${paymentData.conversionId}`, {
          paymentId,
          transactionId: response.data.transactionId
        });
        
        return {
          success: true,
          paymentId,
          paymentUrl: response.data.link,
          provider: 'paybylink',
          status: 'pending',
          transactionId: response.data.transactionId
        };
      } else {
        // Handle error from PayByLink
        logger.error('Error creating payment on PayByLink', {
          error: response.data.error || 'Unknown error',
          conversionId: paymentData.conversionId
        });
        
        return {
          success: false,
          error: response.data.error || 'Failed to create payment',
          provider: 'paybylink',
          status: 'failed'
        };
      }
    } catch (error) {
      logger.error('Exception during payment creation', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'paybylink',
        status: 'failed'
      };
    }
  }

  /**
   * Process a payment notification from PayByLink
   */
  public async processNotification(notificationData: Record<string, any>, signature: string): Promise<boolean> {
    try {
      // Verify signature
      if (!this.verifySignature(notificationData, signature)) {
        logger.warn('Invalid signature in payment notification', {
          notification: notificationData
        });
        return false;
      }
      
      // Extract payment ID from control field
      const paymentId = notificationData.control;
      
      // Find the payment in database
      const payment = await Payment.findOne({ paymentId });
      
      if (!payment) {
        logger.warn('Payment not found for notification', {
          paymentId,
          transactionId: notificationData.transactionId
        });
        return false;
      }
      
      // Map PayByLink status to our status
      let status: PaymentStatus;
      switch (notificationData.status) {
        case 'SUCCESS':
          status = 'completed';
          break;
        case 'PENDING':
          status = 'processing';
          break;
        case 'FAILURE':
          status = 'failed';
          break;
        case 'EXPIRED':
          status = 'failed';
          break;
        case 'REFUND':
          status = 'refunded';
          break;
        default:
          status = 'pending';
      }
      
      // Update payment record
      const updateData: any = {
        status,
        transactionId: notificationData.transactionId,
        providerData: {
          ...payment.providerData,
          status: notificationData.status,
          notificationData
        }
      };
      
      // Add completion date if payment is completed
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
      
      await Payment.findByIdAndUpdate(payment._id, updateData);
      
      logger.info(`Payment ${paymentId} updated with status: ${status}`, {
        transactionId: notificationData.transactionId
      });
      
      return true;
    } catch (error) {
      logger.error('Error processing payment notification', error);
      return false;
    }
  }

  /**
   * Get payment status for a conversion
   */
  public async getPaymentStatus(conversionId: string, userId: string): Promise<{ isPaid: boolean; payment?: any }> {
    try {
      // Find payment for the conversion
      const payment = await Payment.findOne({
        conversionId,
        userId
      });
      
      if (!payment) {
        return { isPaid: false };
      }
      
      // Check if payment is completed
      const isPaid = payment.status === 'completed';
      
      return {
        isPaid,
        payment: {
          id: payment._id,
          status: payment.status,
          provider: payment.provider,
          amount: payment.amount,
          currency: payment.currency,
          createdAt: payment.createdAt,
          completedAt: payment.completedAt
        }
      };
    } catch (error) {
      logger.error(`Error checking payment status for conversion ${conversionId}`, error);
      return { isPaid: false };
    }
  }

  /**
   * Verify a payment is completed for a conversion
   */
  public async verifyPayment(conversionId: string, userId: string): Promise<boolean> {
    try {
      const { isPaid } = await this.getPaymentStatus(conversionId, userId);
      return isPaid;
    } catch (error) {
      logger.error(`Payment verification error for conversion ${conversionId}`, error);
      return false;
    }
  }
}

export default new PaymentService();