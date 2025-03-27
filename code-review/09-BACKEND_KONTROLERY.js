/**
 * 09-BACKEND_KONTROLERY.js
 * 
 * This file contains backend controllers for handling API requests.
 */

// Conversion Controller
// =================
// packages/conversion-service/src/controllers/conversionController.ts
const conversionController = `
import { Request, Response, NextFunction } from 'express';
import { ConversionService } from '../services/conversionService';
import { PdfToDocxService } from '../services/pdfToDocxService';
import { DocxToPdfService } from '../services/docxToPdfService';
import { NotificationService } from '../services/notificationService';
import { Conversion } from '../models/conversion.model';
import { generateSecureLink } from '../utils/secureLinks';
import { logger } from '../utils/logger';

/**
 * Controller for handling document conversion requests
 */
export class ConversionController {
  private conversionService: ConversionService;
  private pdfToDocxService: PdfToDocxService;
  private docxToPdfService: DocxToPdfService;
  private notificationService: NotificationService;
  
  constructor() {
    this.conversionService = new ConversionService();
    this.pdfToDocxService = new PdfToDocxService();
    this.docxToPdfService = new DocxToPdfService();
    this.notificationService = new NotificationService();
  }
  
  /**
   * Start a new conversion job
   */
  public startConversion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      const { conversionType, quality, preserveImages, preserveFormatting } = req.body;
      
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Validate conversion type
      if (!['pdf-to-docx', 'docx-to-pdf'].includes(conversionType)) {
        return res.status(400).json({ message: 'Invalid conversion type' });
      }
      
      // Validate file type
      const isPdf = file.mimetype === 'application/pdf';
      const isDocx = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                    file.mimetype === 'application/msword';
      
      if ((conversionType === 'pdf-to-docx' && !isPdf) || 
          (conversionType === 'docx-to-pdf' && !isDocx)) {
        return res.status(400).json({ message: 'File type does not match conversion type' });
      }
      
      // Create conversion record
      const userId = req.user?.id;
      const conversion = await this.conversionService.createConversion({
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        filePath: file.path,
        conversionType,
        options: {
          quality: quality || 'high',
          preserveImages: preserveImages === 'true' || preserveImages === true,
          preserveFormatting: preserveFormatting === 'true' || preserveFormatting === true,
        },
        status: 'pending',
        userId,
      });
      
      // Start conversion process in background
      this.processConversion(conversion);
      
      // Return conversion ID to client
      return res.status(201).json({
        message: 'Conversion job created successfully',
        conversionId: conversion.id,
      });
      
    } catch (error) {
      logger.error('Error starting conversion:', error);
      next(error);
    }
  };
  
  /**
   * Get conversion status
   */
  public getConversionStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const conversion = await this.conversionService.getConversionById(id);
      
      if (!conversion) {
        return res.status(404).json({ message: 'Conversion not found' });
      }
      
      // Generate secure download link if conversion is completed
      let downloadUrl = '';
      if (conversion.status === 'completed' && conversion.outputFilePath) {
        downloadUrl = generateSecureLink(
          conversion.id, 
          conversion.outputFileName || 'converted-file',
          req.user?.id === conversion.userId
        );
      }
      
      // Check if payment is required for non-authenticated users or non-premium conversions
      const paymentRequired = !req.user && conversion.status === 'completed';
      
      return res.status(200).json({
        id: conversion.id,
        fileName: conversion.fileName,
        status: conversion.status,
        progress: conversion.progress,
        createdAt: conversion.createdAt,
        completedAt: conversion.completedAt,
        error: conversion.error,
        downloadUrl: paymentRequired ? null : downloadUrl,
        paymentRequired,
      });
      
    } catch (error) {
      logger.error('Error getting conversion status:', error);
      next(error);
    }
  };
  
  /**
   * Cancel a conversion job
   */
  public cancelConversion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const conversion = await this.conversionService.getConversionById(id);
      
      if (!conversion) {
        return res.status(404).json({ message: 'Conversion not found' });
      }
      
      // Only allow cancellation of pending or processing conversions
      if (conversion.status !== 'pending' && conversion.status !== 'processing') {
        return res.status(400).json({ message: 'Cannot cancel completed or failed conversion' });
      }
      
      // Check user permission (owner or admin)
      if (conversion.userId && req.user?.id !== conversion.userId && req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to cancel this conversion' });
      }
      
      // Update conversion status
      await this.conversionService.updateConversion(id, {
        status: 'cancelled',
      });
      
      return res.status(200).json({
        message: 'Conversion cancelled successfully',
      });
      
    } catch (error) {
      logger.error('Error cancelling conversion:', error);
      next(error);
    }
  };
  
  /**
   * Process a conversion job
   * This is a background process not exposed via API
   */
  private processConversion = async (conversion: Conversion) => {
    try {
      // Update status to processing
      await this.conversionService.updateConversion(conversion.id, {
        status: 'processing',
        progress: 0,
      });
      
      // Update progress callback
      const updateProgress = async (progress: number) => {
        await this.conversionService.updateConversion(conversion.id, {
          progress,
        });
        
        // Notify client of progress via WebSocket
        this.notificationService.notifyConversionProgress(
          conversion.id, 
          progress
        );
      };
      
      let outputFilePath: string;
      let outputFileName: string;
      
      // Perform conversion based on type
      if (conversion.conversionType === 'pdf-to-docx') {
        const result = await this.pdfToDocxService.convert(
          conversion.filePath, 
          conversion.options,
          updateProgress
        );
        outputFilePath = result.outputPath;
        outputFileName = \`\${conversion.fileName.replace(/\\.pdf$/i, '')}.docx\`;
      } else {
        const result = await this.docxToPdfService.convert(
          conversion.filePath, 
          conversion.options,
          updateProgress
        );
        outputFilePath = result.outputPath;
        outputFileName = \`\${conversion.fileName.replace(/\\.docx$/i, '')}.pdf\`;
      }
      
      // Update conversion with output file info
      await this.conversionService.updateConversion(conversion.id, {
        status: 'completed',
        progress: 100,
        outputFilePath,
        outputFileName,
        completedAt: new Date(),
      });
      
      // Notify client of completion via WebSocket
      this.notificationService.notifyConversionComplete(
        conversion.id, 
        outputFileName,
        !conversion.userId // paymentRequired flag for anonymous users
      );
      
      logger.info(\`Conversion completed: \${conversion.id}\`);
      
    } catch (error) {
      logger.error(\`Conversion failed: \${conversion.id}\`, error);
      
      // Update conversion with error
      await this.conversionService.updateConversion(conversion.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Notify client of error via WebSocket
      this.notificationService.notifyConversionError(
        conversion.id, 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };
}

export default new ConversionController();
`;

// Download Controller
// ===============
// packages/conversion-service/src/controllers/downloadController.ts
const downloadController = `
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { ConversionService } from '../services/conversionService';
import { validateSecureLink } from '../utils/secureLinks';
import { logger } from '../utils/logger';

/**
 * Controller for handling file downloads
 */
export class DownloadController {
  private conversionService: ConversionService;
  
  constructor() {
    this.conversionService = new ConversionService();
  }
  
  /**
   * Download a converted file
   */
  public downloadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      
      // Validate secure download token
      const validationResult = validateSecureLink(token);
      
      if (!validationResult.valid) {
        return res.status(400).json({ message: 'Invalid or expired download link' });
      }
      
      const { id: conversionId, isPremium } = validationResult;
      
      // Get conversion details
      const conversion = await this.conversionService.getConversionById(conversionId);
      
      if (!conversion) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Check conversion status
      if (conversion.status !== 'completed' || !conversion.outputFilePath) {
        return res.status(400).json({ message: 'File is not ready for download' });
      }
      
      // Check if payment is required for this download
      const requiresPayment = !req.user && !isPremium;
      
      if (requiresPayment) {
        return res.status(402).json({ 
          message: 'Payment required to download this file',
          conversionId: conversion.id
        });
      }
      
      // Check if file exists
      if (!fs.existsSync(conversion.outputFilePath)) {
        return res.status(404).json({ message: 'File not found on server' });
      }
      
      // Determine content type
      let contentType = 'application/octet-stream';
      if (conversion.outputFileName.endsWith('.pdf')) {
        contentType = 'application/pdf';
      } else if (conversion.outputFileName.endsWith('.docx')) {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
      
      // Set appropriate headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', \`attachment; filename="\${conversion.outputFileName}"\`);
      
      // Stream file to response
      const fileStream = fs.createReadStream(conversion.outputFilePath);
      fileStream.pipe(res);
      
      // Update download count
      await this.conversionService.incrementDownloadCount(conversionId);
      
      // Log download
      logger.info(\`File downloaded: \${conversion.id} - \${conversion.outputFileName}\`);
      
    } catch (error) {
      logger.error('Error downloading file:', error);
      next(error);
    }
  };
  
  /**
   * Check if a download is available
   */
  public checkDownload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      
      // Validate secure download token
      const validationResult = validateSecureLink(token);
      
      if (!validationResult.valid) {
        return res.status(400).json({ message: 'Invalid or expired download link' });
      }
      
      const { id: conversionId, isPremium } = validationResult;
      
      // Get conversion details
      const conversion = await this.conversionService.getConversionById(conversionId);
      
      if (!conversion) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Check conversion status
      if (conversion.status !== 'completed' || !conversion.outputFilePath) {
        return res.status(400).json({ message: 'File is not ready for download' });
      }
      
      // Check if payment is required for this download
      const requiresPayment = !req.user && !isPremium;
      
      return res.status(200).json({
        available: true,
        fileName: conversion.outputFileName,
        fileSize: fs.existsSync(conversion.outputFilePath) 
          ? fs.statSync(conversion.outputFilePath).size 
          : undefined,
        conversionType: conversion.conversionType,
        requiresPayment,
      });
      
    } catch (error) {
      logger.error('Error checking download:', error);
      next(error);
    }
  };
}

export default new DownloadController();
`;

// Payment Controller
// ==============
// packages/conversion-service/src/controllers/paymentController.ts
const paymentController = `
import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { env } from '../config/env';
import { ConversionService } from '../services/conversionService';
import { PaymentService } from '../services/paymentService';
import { generateSecureLink } from '../utils/secureLinks';
import { logger } from '../utils/logger';

// Initialize Stripe with API key
const stripe = new Stripe(env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-08-01',
});

/**
 * Controller for handling payment operations
 */
export class PaymentController {
  private conversionService: ConversionService;
  private paymentService: PaymentService;
  
  constructor() {
    this.conversionService = new ConversionService();
    this.paymentService = new PaymentService();
  }
  
  /**
   * Create a checkout session for a conversion
   */
  public createCheckout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { conversionId, successUrl, cancelUrl } = req.body;
      
      if (!conversionId || !successUrl || !cancelUrl) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }
      
      // Get conversion details
      const conversion = await this.conversionService.getConversionById(conversionId);
      
      if (!conversion) {
        return res.status(404).json({ message: 'Conversion not found' });
      }
      
      // Check conversion status
      if (conversion.status !== 'completed') {
        return res.status(400).json({ message: 'Conversion is not completed yet' });
      }
      
      // Generate a unique ID for this checkout session
      const sessionId = \`checkout_\${conversionId}_\${Date.now()}\`;
      
      // Create checkout session with Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Document Conversion',
                description: \`\${conversion.conversionType === 'pdf-to-docx' ? 'PDF to DOCX' : 'DOCX to PDF'} conversion\`,
              },
              unit_amount: 299, // $2.99
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: \`\${successUrl}?session_id={CHECKOUT_SESSION_ID}\`,
        cancel_url: cancelUrl,
        metadata: {
          conversionId,
          sessionId,
          userId: req.user?.id || 'anonymous',
        },
      });
      
      // Store checkout session info
      await this.paymentService.createPaymentRecord({
        stripeSessionId: session.id,
        conversionId,
        userId: req.user?.id,
        amount: 299, // $2.99 in cents
        currency: 'usd',
        status: 'pending',
      });
      
      return res.status(200).json({
        checkoutUrl: session.url,
        sessionId: session.id,
      });
      
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      next(error);
    }
  };
  
  /**
   * Handle webhook events from Stripe
   */
  public handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      
      if (!sig) {
        return res.status(400).json({ message: 'Missing Stripe signature' });
      }
      
      // Verify webhook signature
      let event;
      try {
        event = stripe.webhooks.constructEvent(
          req.body, 
          sig, 
          env.STRIPE_WEBHOOK_SECRET || ''
        );
      } catch (err) {
        logger.error('Webhook signature verification failed:', err);
        return res.status(400).json({ message: 'Invalid signature' });
      }
      
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          // Update payment record
          await this.paymentService.updatePaymentBySessionId(session.id, {
            status: 'completed',
            completedAt: new Date(),
          });
          
          // Get conversion ID from metadata
          const conversionId = session.metadata?.conversionId;
          
          if (conversionId) {
            // Generate premium download link
            const premiumLink = generateSecureLink(conversionId, '', true);
            
            // TODO: Send email with download link if user provided email
            
            logger.info(\`Payment completed for conversion: \${conversionId}\`);
          }
          
          break;
        }
        
        case 'checkout.session.expired': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          // Update payment record
          await this.paymentService.updatePaymentBySessionId(session.id, {
            status: 'expired',
          });
          
          break;
        }
        
        // Add other event types as needed
      }
      
      return res.status(200).json({ received: true });
      
    } catch (error) {
      logger.error('Error handling webhook:', error);
      next(error);
    }
  };
  
  /**
   * Verify payment status for a conversion
   */
  public verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { conversionId } = req.params;
      const { sessionId } = req.query;
      
      if (!sessionId) {
        return res.status(400).json({ message: 'Missing session ID' });
      }
      
      // Get payment record
      const payment = await this.paymentService.getPaymentBySessionId(sessionId as string);
      
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      // Verify that payment is for the requested conversion
      if (payment.conversionId !== conversionId) {
        return res.status(400).json({ message: 'Payment does not match conversion ID' });
      }
      
      // Check payment status
      if (payment.status !== 'completed') {
        return res.status(400).json({ 
          message: 'Payment not completed', 
          status: payment.status 
        });
      }
      
      // Get conversion details
      const conversion = await this.conversionService.getConversionById(conversionId);
      
      if (!conversion) {
        return res.status(404).json({ message: 'Conversion not found' });
      }
      
      // Generate premium download link
      const downloadUrl = generateSecureLink(
        conversion.id, 
        conversion.outputFileName || 'converted-file',
        true // isPremium
      );
      
      return res.status(200).json({
        status: 'success',
        message: 'Payment verified',
        downloadUrl,
      });
      
    } catch (error) {
      logger.error('Error verifying payment:', error);
      next(error);
    }
  };
}

export default new PaymentController();
`;