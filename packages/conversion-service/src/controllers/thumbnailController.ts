import { Request, Response } from 'express';
import fs from 'fs';
import thumbnailService from '../services/thumbnailService';
import File from '../models/file.model';
import Conversion from '../models/conversion.model';
import logger from '../utils/logger';

/**
 * Generate a thumbnail for a file
 */
export async function generateThumbnail(req: Request, res: Response): Promise<void> {
  try {
    const { fileId } = req.params;
    const userId = req.user!.id;
    const { page, width } = req.query;
    
    const options = {
      page: page ? parseInt(page as string, 10) : undefined,
      width: width ? parseInt(width as string, 10) : undefined,
    };
    
    const { thumbnailId, thumbnailUrl } = await thumbnailService.generateThumbnail(fileId, userId, options);
    
    res.status(201).json({
      success: true,
      message: 'Thumbnail generated successfully',
      data: {
        thumbnailId,
        thumbnailUrl
      }
    });
  } catch (error) {
    logger.error('Generate thumbnail error', error);
    
    res.status(error instanceof Error && error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate thumbnail'
    });
  }
}

/**
 * Get a thumbnail by its ID
 */
export async function getThumbnail(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    // Get file record
    const file = await File.findById(id);
    
    if (!file) {
      res.status(404).json({
        success: false,
        message: 'Thumbnail not found'
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
    
    // Check if it's actually a thumbnail (by MIME type or other criteria)
    if (!file.mimeType.startsWith('image/')) {
      res.status(400).json({
        success: false,
        message: 'Requested file is not a thumbnail'
      });
      return;
    }
    
    try {
      // Thumbnails aren't encrypted, so we can read them directly
      const fileBuffer = fs.readFileSync(file.path);
      
      // Set content headers
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', fileBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      
      // Send file
      res.send(fileBuffer);
    } catch (error) {
      logger.error(`Error reading thumbnail ${file.path}`, error);
      res.status(500).json({
        success: false,
        message: 'Error reading thumbnail'
      });
    }
  } catch (error) {
    logger.error('Get thumbnail error', error);
    
    res.status(error instanceof Error && error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get thumbnail'
    });
  }
}

/**
 * Generate a thumbnail for a conversion result
 */
export async function generateConversionThumbnail(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { page, width } = req.query;
    
    // Get conversion
    const conversion = await Conversion.findById(id);
    
    if (!conversion) {
      res.status(404).json({
        success: false,
        message: 'Conversion not found'
      });
      return;
    }
    
    // Verify the conversion belongs to the user
    if (conversion.userId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied to conversion'
      });
      return;
    }
    
    // Check if conversion is completed
    if (conversion.status !== 'completed') {
      res.status(400).json({
        success: false,
        message: 'Conversion is not complete yet'
      });
      return;
    }
    
    if (!conversion.resultFileId) {
      res.status(404).json({
        success: false,
        message: 'Result file not found'
      });
      return;
    }
    
    const options = {
      page: page ? parseInt(page as string, 10) : undefined,
      width: width ? parseInt(width as string, 10) : undefined,
    };
    
    const { thumbnailId, thumbnailUrl } = await thumbnailService.generateThumbnail(
      conversion.resultFileId.toString(),
      userId,
      options
    );
    
    res.status(201).json({
      success: true,
      message: 'Thumbnail generated successfully',
      data: {
        thumbnailId,
        thumbnailUrl
      }
    });
  } catch (error) {
    logger.error('Generate conversion thumbnail error', error);
    
    res.status(error instanceof Error && error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate thumbnail'
    });
  }
}

export default {
  generateThumbnail,
  getThumbnail,
  generateConversionThumbnail
};