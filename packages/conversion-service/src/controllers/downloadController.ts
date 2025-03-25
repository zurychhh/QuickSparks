import { Request, Response } from 'express';
import fs from 'fs';
import axios from 'axios';
import secureLinks from '../utils/secureLinks';
import File from '../models/file.model';
import Conversion from '../models/conversion.model';
import fileStorage from '../utils/fileStorage';
import logger from '../utils/logger';
import env from '../config/env';

/**
 * Verify payment status for a conversion
 */
async function verifyPayment(conversionId: string, userId: string): Promise<boolean> {
  try {
    // Call payment service to verify payment
    const response = await axios.get(
      `${env.PAYMENT_SERVICE_URL}/payments/status/${conversionId}`,
      {
        headers: {
          // Include user ID in request for authentication
          'User-Id': userId,
          'Authorization': `Bearer ${env.INTERNAL_API_KEY}`
        }
      }
    );
    
    // Return true if payment is completed
    return response.data.success && response.data.data.isPaid;
  } catch (error) {
    logger.error(`Payment verification error for conversion ${conversionId}`, error);
    return false;
  }
}

/**
 * Generate a secure download token for a file
 */
export async function generateDownloadToken(req: Request, res: Response): Promise<void> {
  try {
    const { fileId } = req.params;
    const userId = req.user!.id;
    
    // Get file record
    const file = await File.findById(fileId);
    
    if (!file) {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
      return;
    }
    
    // Check that file belongs to user
    if (file.userId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }
    
    // Check if file is expired
    if (file.expiresAt < new Date()) {
      res.status(410).json({
        success: false,
        message: 'File has expired'
      });
      return;
    }
    
    // If this is a result file from a conversion, verify payment
    if (file.type === 'conversion_result') {
      // Find the conversion
      const conversion = await Conversion.findOne({ resultFile: fileId });
      
      if (conversion) {
        // Verify payment
        const isPaid = await verifyPayment(conversion._id.toString(), userId);
        
        if (!isPaid) {
          // Payment required
          res.status(402).json({
            success: false,
            message: 'Payment required for this conversion',
            data: {
              conversionId: conversion._id.toString()
            }
          });
          return;
        }
      }
    }
    
    // Get expiry time from query params or use default
    const expiresIn = req.query.expiresIn ? 
      parseInt(req.query.expiresIn as string, 10) : 
      env.DOWNLOAD_TOKEN_EXPIRY;
    
    // Generate download token
    const token = secureLinks.generateDownloadToken(
      fileId,
      userId,
      Math.min(expiresIn, env.DOWNLOAD_TOKEN_EXPIRY) // Never allow longer than configured max
    );
    
    // Build download URL
    const downloadUrl = `/api/downloads/file/${token}`;
    
    res.status(200).json({
      success: true,
      data: {
        token,
        downloadUrl,
        expiresIn: Math.min(expiresIn, env.DOWNLOAD_TOKEN_EXPIRY)
      }
    });
  } catch (error) {
    logger.error('Generate download token error', error);
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate download token'
    });
  }
}

/**
 * Download a file using a secure token
 */
export async function downloadFileWithToken(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params;
    
    // Verify and decode token
    const tokenData = secureLinks.verifyDownloadToken(token);
    
    if (!tokenData) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired download token'
      });
      return;
    }
    
    const { fileId, userId } = tokenData;
    
    // Get file record
    const file = await File.findById(fileId);
    
    if (!file) {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
      return;
    }
    
    // Double-check that file belongs to the user from the token
    if (file.userId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }
    
    // Check if file is expired
    if (file.expiresAt < new Date()) {
      res.status(410).json({
        success: false,
        message: 'File has expired'
      });
      return;
    }
    
    // If this is a result file from a conversion, verify payment
    if (file.type === 'conversion_result') {
      // Find the conversion
      const conversion = await Conversion.findOne({ resultFile: fileId });
      
      if (conversion) {
        // Verify payment
        const isPaid = await verifyPayment(conversion._id.toString(), userId);
        
        if (!isPaid) {
          // Payment required - this shouldn't happen normally since the token should only be generated after payment
          // But it's good to double-check for security
          res.status(402).json({
            success: false,
            message: 'Payment required for this conversion',
            data: {
              conversionId: conversion._id.toString()
            }
          });
          return;
        }
      }
    }
    
    try {
      // Read and decrypt file if needed
      let fileBuffer: Buffer;
      
      if (file.encryptionMethod === 'aes-256-gcm') {
        fileBuffer = await fileStorage.readFileSecurely(file.path, userId);
      } else {
        fileBuffer = fs.readFileSync(file.path);
      }
      
      // Set content headers
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalFilename)}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      
      // Disable caching for secure files
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Send file
      res.send(fileBuffer);
      
      logger.info(`File downloaded successfully: ${file._id} by user ${userId}`);
    } catch (error) {
      logger.error(`Error reading file ${file.path}`, error);
      res.status(500).json({
        success: false,
        message: 'Error reading file'
      });
    }
  } catch (error) {
    logger.error('Download file with token error', error);
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to download file'
    });
  }
}

export default {
  generateDownloadToken,
  downloadFileWithToken
};