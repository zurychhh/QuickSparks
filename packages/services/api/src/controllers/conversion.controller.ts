import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Conversion from '../models/conversion.model';
import File from '../models/file.model';
import { ApiError } from '../utils/errorHandler';
import { successResponse } from '../utils/apiResponse';

/**
 * Start a new conversion
 * 
 * @route POST /api/convert
 * @access Private
 */
export const startConversion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { conversionType } = req.body;
    
    // In a real implementation, we would handle the file upload here
    // For now, we'll create a mock conversion record
    
    // Validate file existence (in a real implementation)
    const sourceFileId = new mongoose.Types.ObjectId(); // This would be the actual file ID
    
    // Create conversion record
    const conversion = await Conversion.create({
      userId: req.user._id,
      sourceFileId,
      conversionType,
      status: 'pending',
    });
    
    // In a real implementation, we would trigger the conversion process here
    // For now, we'll just return the conversion record
    
    successResponse(
      res,
      {
        conversionId: conversion._id,
        status: conversion.status,
      },
      'Conversion started successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get conversion status
 * 
 * @route GET /api/convert/:id
 * @access Private
 */
export const getConversionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Find conversion
    const conversion = await Conversion.findById(id);
    
    if (!conversion) {
      throw new ApiError('Conversion not found', 404);
    }
    
    // Check if user owns this conversion
    if (conversion.userId.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to access this conversion', 403);
    }
    
    successResponse(
      res,
      {
        conversionId: conversion._id,
        status: conversion.status,
        conversionType: conversion.conversionType,
        createdAt: conversion.createdAt,
        completedAt: conversion.completedAt,
        error: conversion.error,
      },
      'Conversion status retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of user's conversions
 * 
 * @route GET /api/convert/history
 * @access Private
 */
export const getConversionHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string || 'all';
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = { userId: req.user._id };
    
    if (status !== 'all') {
      query.status = status;
    }
    
    // Get count
    const total = await Conversion.countDocuments(query);
    
    // Get conversions
    const conversions = await Conversion.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    successResponse(
      res,
      {
        conversions: conversions.map(conversion => ({
          id: conversion._id,
          status: conversion.status,
          conversionType: conversion.conversionType,
          createdAt: conversion.createdAt,
          completedAt: conversion.completedAt,
        })),
      },
      'Conversion history retrieved successfully',
      200,
      {
        page,
        limit,
        total,
        totalPages,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Download converted file
 * 
 * @route GET /api/convert/download/:id
 * @access Private
 */
export const downloadConvertedFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Find conversion
    const conversion = await Conversion.findById(id);
    
    if (!conversion) {
      throw new ApiError('Conversion not found', 404);
    }
    
    // Check if conversion is complete
    if (conversion.status !== 'completed') {
      throw new ApiError('Conversion is not yet complete', 400);
    }
    
    // Check if user owns this conversion
    if (conversion.userId.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to access this file', 403);
    }
    
    // Check if resultFileId exists
    if (!conversion.resultFileId) {
      throw new ApiError('Converted file not found', 404);
    }
    
    // Find file
    const file = await File.findById(conversion.resultFileId);
    
    if (!file) {
      throw new ApiError('Converted file not found', 404);
    }
    
    // In a real implementation, we would stream the file from storage here
    // For now, we'll just send a mock response
    
    // Mock response
    successResponse(
      res,
      {
        fileUrl: `/mock-download/${file.filename}`, // In a real implementation, this would be a signed URL
        fileName: file.originalFilename,
        fileSize: file.size,
        mimeType: file.mimeType,
      },
      'File download link generated successfully'
    );
  } catch (error) {
    next(error);
  }
};