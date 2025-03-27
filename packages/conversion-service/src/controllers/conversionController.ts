import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import conversionService from '../services/conversionService';
import File from '../models/file.model';
import fileStorage from '../utils/fileStorage';
import logger from '../utils/logger';

/**
 * Upload file and start conversion process
 */
export async function uploadAndConvert(req: Request, res: Response): Promise<void> {
  try {
    const { conversionType, quality = 'high', preserveFormatting = 'true' } = req.body;
    const file = req.file;
    
    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }
    
    // Get user ID from request (would be set by auth middleware)
    const userId = req.user!.id;
    const userTier = req.user!.tier || 'free';
    
    // Read the uploaded file
    const fileBuffer = fs.readFileSync(file.path);
    
    // Encrypt and save the file
    const encryptedPath = file.path + '.enc';
    const encryptionMetadata = await fileStorage.saveFileSecurely(
      encryptedPath,
      fileBuffer,
      userId
    );
    
    // Delete the original unencrypted file
    fs.unlinkSync(file.path);
    
    // Calculate expiration date
    const expiresAt = fileStorage.calculateFileExpiration(userTier);
    
    // Create file record in database
    const fileRecord = await File.create({
      userId,
      filename: path.basename(encryptedPath),
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: encryptedPath,
      expiresAt,
      isDeleted: false,
      encryptionMethod: encryptionMetadata.encryptionMethod,
      keyIdentifier: encryptionMetadata.keyIdentifier,
    });
    
    // Start conversion
    const { conversionId, jobId } = await conversionService.startConversion({
      userId,
      sourceFileId: fileRecord._id.toString(),
      conversionType,
      quality: quality as any,
      preserveFormatting: preserveFormatting === 'true',
      userTier
    });
    
    res.status(201).json({
      success: true,
      message: 'File uploaded and conversion started',
      data: {
        conversionId,
        fileId: fileRecord._id,
        jobId,
        status: 'pending'
      }
    });
  } catch (error) {
    logger.error('Upload and convert error', error);
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process file'
    });
  }
}

/**
 * Start a conversion with an existing file
 */
export async function startConversion(req: Request, res: Response): Promise<void> {
  try {
    const { fileId, conversionType, quality = 'high', preserveFormatting = true } = req.body;
    const userId = req.user!.id;
    const userTier = req.user!.tier || 'free';
    
    const { conversionId, jobId } = await conversionService.startConversion({
      userId,
      sourceFileId: fileId,
      conversionType,
      quality,
      preserveFormatting,
      userTier
    });
    
    res.status(201).json({
      success: true,
      message: 'Conversion started',
      data: {
        conversionId,
        jobId,
        status: 'pending'
      }
    });
  } catch (error) {
    logger.error('Start conversion error', error);
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to start conversion'
    });
  }
}

/**
 * Get conversion status
 */
export async function getConversionStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const status = await conversionService.getConversionStatus(id, userId);
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Get conversion status error', error);
    
    res.status(error instanceof Error && error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get conversion status'
    });
  }
}

/**
 * Get all conversions for a user
 */
export async function getUserConversions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string || null;
    
    const result = await conversionService.getUserConversions(userId, page, limit, status);
    
    res.status(200).json({
      success: true,
      data: result.conversions,
      pagination: {
        page: result.page,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    logger.error('Get user conversions error', error);
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get conversions'
    });
  }
}

/**
 * Cancel a conversion
 */
export async function cancelConversion(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    await conversionService.cancelConversion(id, userId);
    
    res.status(200).json({
      success: true,
      message: 'Conversion canceled'
    });
  } catch (error) {
    logger.error('Cancel conversion error', error);
    
    res.status(error instanceof Error && error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to cancel conversion'
    });
  }
}

/**
 * Download a converted file
 */
export async function downloadConvertedFile(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    // Get conversion
    const conversion = await conversionService.getConversionStatus(id, userId);
    
    if (conversion.status !== 'completed') {
      res.status(400).json({
        success: false,
        message: 'Conversion is not complete yet'
      });
      return;
    }
    
    if (!conversion.resultFile) {
      res.status(404).json({
        success: false,
        message: 'Result file not found'
      });
      return;
    }
    
    // Get file record
    const file = await File.findById(conversion.resultFile.id);
    
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
    
    try {
      // Read and decrypt file
      const fileBuffer = await fileStorage.readFileSecurely(file.path, userId);
      
      // Set content headers
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalFilename)}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      
      // Send file
      res.send(fileBuffer);
    } catch (error) {
      logger.error(`Error reading file ${file.path}`, error);
      res.status(500).json({
        success: false,
        message: 'Error reading file'
      });
    }
  } catch (error) {
    logger.error('Download file error', error);
    
    res.status(error instanceof Error && error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to download file'
    });
  }
}

export default {
  uploadAndConvert,
  startConversion,
  getConversionStatus,
  getUserConversions,
  cancelConversion,
  downloadConvertedFile
};