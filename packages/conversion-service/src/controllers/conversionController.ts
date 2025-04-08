import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import conversionService from '../services/conversionService';
import File from '../models/file.model';
import fileStorage from '../utils/fileStorage';
import fileStreaming from '../utils/fileStreaming';
import logger from '../utils/logger';
import metrics from '../middleware/monitoring/metrics';

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
    
    // Parse source and target formats from conversionType
    const [sourceFormat, targetFormat] = conversionType.split('-to-');
    
    // Track file size in metrics
    metrics.trackFileSize(sourceFormat, file.size);
    
    // Track start of conversion in metrics
    metrics.trackConversion(sourceFormat, targetFormat, 'started');
    
    // Measure conversion time
    const startTime = Date.now();
    
    // Encrypt and save the file
    const encryptedPath = file.path + '.enc';
    
    // Check file size to determine whether to use streaming
    const fileStats = fs.statSync(file.path);
    const STREAM_THRESHOLD = 5 * 1024 * 1024; // 5MB threshold for streaming
    
    let encryptionMetadata;
    if (fileStats.size > STREAM_THRESHOLD) {
      // Use streaming for large files through compatible interface
      logger.info(`Using streaming for large file upload: ${file.path} (${fileStats.size} bytes)`);
      encryptionMetadata = await fileStreaming.streamFileSecurely(
        file.path,
        encryptedPath,
        userId
      );
    } else {
      // For smaller files, use the buffer method through compatible interface
      const fileBuffer = fs.readFileSync(file.path);
      encryptionMetadata = await fileStorage.saveFileSecurely(
        encryptedPath,
        fileBuffer,
        userId
      );
    }
    
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
    
    // Track conversion failure in metrics if possible
    try {
      const { conversionType } = req.body;
      if (conversionType) {
        const [sourceFormat, targetFormat] = conversionType.split('-to-');
        metrics.trackConversion(sourceFormat, targetFormat, 'failed');
      }
    } catch (err) {
      logger.warn('Could not track conversion failure metrics', err);
    }
    
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
    
    // Parse source and target formats from conversionType
    const [sourceFormat, targetFormat] = conversionType.split('-to-');
    
    // Track start of conversion in metrics
    metrics.trackConversion(sourceFormat, targetFormat, 'started');
    
    // Start conversion
    const startTime = Date.now();
    const { conversionId, jobId } = await conversionService.startConversion({
      userId,
      sourceFileId: fileId,
      conversionType,
      quality,
      preserveFormatting,
      userTier
    });
    
    // Response to client
    res.status(201).json({
      success: true,
      message: 'Conversion started',
      data: {
        conversionId,
        jobId,
        status: 'pending'
      }
    });
    
    // Track file size when available
    try {
      const fileRecord = await File.findById(fileId);
      if (fileRecord && fileRecord.size) {
        metrics.trackFileSize(sourceFormat, fileRecord.size);
      }
    } catch (err) {
      logger.warn('Could not track file size metrics', err);
    }
  } catch (error) {
    logger.error('Start conversion error', error);
    
    // Track conversion failure in metrics if possible
    try {
      const { conversionType } = req.body;
      if (conversionType) {
        const [sourceFormat, targetFormat] = conversionType.split('-to-');
        metrics.trackConversion(sourceFormat, targetFormat, 'failed');
      }
    } catch (err) {
      logger.warn('Could not track conversion failure metrics', err);
    }
    
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
    
    // If conversion is complete and has conversionType, track it in metrics
    if (status.status === 'completed' && status.conversionType) {
      try {
        const [sourceFormat, targetFormat] = status.conversionType.split('-to-');
        
        // If conversion has timestamps, calculate duration
        if (status.startedAt && status.completedAt) {
          const startTime = new Date(status.startedAt).getTime();
          const endTime = new Date(status.completedAt).getTime();
          const durationSecs = (endTime - startTime) / 1000;
          
          // Track completion with duration
          metrics.trackConversion(sourceFormat, targetFormat, 'completed', durationSecs);
        } else {
          // Track completion without duration
          metrics.trackConversion(sourceFormat, targetFormat, 'completed');
        }
      } catch (err) {
        logger.warn('Could not track conversion completion metrics', err);
      }
    }
    
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
    
    // Get conversion details before cancellation to get conversion type
    try {
      const conversionDetails = await conversionService.getConversionStatus(id, userId);
      
      // If conversion has a type, track the cancellation
      if (conversionDetails && conversionDetails.conversionType) {
        const [sourceFormat, targetFormat] = conversionDetails.conversionType.split('-to-');
        // We use 'failed' status for cancellations as well
        metrics.trackConversion(sourceFormat, targetFormat, 'failed');
      }
    } catch (err) {
      logger.warn('Could not track conversion cancellation metrics', err);
    }
    
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
      // Track metrics for file download if conversion type is available
      if (conversion.conversionType) {
        try {
          const [sourceFormat, targetFormat] = conversion.conversionType.split('-to-');
          
          // Track the download event
          metrics.trackDownload(sourceFormat, targetFormat);
          
          // Track target file size if available
          if (file.size) {
            // Use target format as file type for the result file
            metrics.trackFileSize(targetFormat, file.size);
          }
        } catch (err) {
          logger.warn('Could not track file download metrics', err);
        }
      }
      
      // Check file size to determine whether to use streaming
      const fileStats = fs.statSync(file.path);
      const STREAM_THRESHOLD = 5 * 1024 * 1024; // 5MB threshold for streaming
      
      try {
        if (fileStats.size > STREAM_THRESHOLD) {
          // Use streaming for large files
          logger.info(`Using streaming for large file download: ${file.path} (${fileStats.size} bytes)`);
          
          // Stream the file to the client using our improved compatible interface
          // This handles format detection and streaming internally
          
          // Set content headers first - these will be handled properly by the streamFileSecurelyForReading function
          res.setHeader('Content-Type', file.mimeType);
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalFilename)}"`);
          
          // Use the improved streaming function with transfer-encoding: chunked
          await fileStreaming.streamFileSecurelyForReading(
            file.path, 
            userId, 
            res,
            { 
              // Use a larger chunk size for better performance with large files
              highWaterMark: 256 * 1024, // 256KB chunks
              chunkSize: STREAM_THRESHOLD // Use same threshold for consistency
            }
          );
        } else {
          // For smaller files, use the buffer method
          const fileBuffer = await fileStorage.readFileSecurely(file.path, userId);
          
          // Set content headers
          res.setHeader('Content-Type', file.mimeType);
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalFilename)}"`);
          res.setHeader('Content-Length', fileBuffer.length);
          
          // Send file
          res.send(fileBuffer);
        }
      } catch (error) {
        logger.error(`Error downloading file ${file.path}`, error);
        
        // If headers already sent, just log the error and end response
        if (res.headersSent) {
          logger.error('Error occurred after headers sent:', error);
          if (!res.writableEnded) res.end();
        } else {
          // Otherwise send error response
          res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Error downloading file'
          });
        }
      }
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