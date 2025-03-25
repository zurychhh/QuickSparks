import fs from 'fs';
import path from 'path';
import { ConversionJob, ConversionType, ConversionQuality, UserTier } from '../types/conversion';
import queueService from '../config/queue';
import Conversion from '../models/conversion.model';
import File from '../models/file.model';
import fileStorage from '../utils/fileStorage';
import logger from '../utils/logger';
import notificationService from '../services/notificationService';

/**
 * Start a new conversion job
 */
export async function startConversion({
  userId,
  sourceFileId,
  conversionType,
  quality = 'high',
  preserveFormatting = true,
  userTier = 'free'
}: {
  userId: string;
  sourceFileId: string;
  conversionType: ConversionType;
  quality?: ConversionQuality;
  preserveFormatting?: boolean;
  userTier?: UserTier;
}): Promise<{ conversionId: string; jobId: string; estimatedTime: number }> {
  try {
    // Find source file
    const sourceFile = await File.findById(sourceFileId);
    
    if (!sourceFile) {
      throw new Error('Source file not found');
    }
    
    // Verify the file belongs to the user
    if (sourceFile.userId.toString() !== userId) {
      throw new Error('Access denied to source file');
    }
    
    // Create conversion record
    const conversion = await Conversion.create({
      userId,
      sourceFileId,
      conversionType,
      quality,
      preserveFormatting,
      status: 'pending'
    });
    
    // Prepare source and output paths
    const sourceFilePath = sourceFile.path;
    
    // Determine output file extension
    const outputExtension = conversionType === 'pdf-to-docx' ? '.docx' : '.pdf';
    
    // Create output filename
    const filenameWithoutExt = path.basename(sourceFile.originalFilename, path.extname(sourceFile.originalFilename));
    const outputFilename = fileStorage.generateSecureFilename(`${filenameWithoutExt}${outputExtension}`);
    
    // Ensure output directory exists
    const outputDir = await fileStorage.ensureUserStorageDirectory(userId, 'outputs');
    const outputFilePath = path.join(outputDir, outputFilename);
    
    // Create job data
    const jobData: ConversionJob = {
      conversionId: conversion._id.toString(),
      userId,
      sourceFilePath,
      outputFilePath,
      originalFilename: sourceFile.originalFilename,
      conversionType,
      quality,
      preserveFormatting,
      userTier
    };
    
    // Add job to queue with priority based on user tier
    const job = await queueService.addConversionJob(jobData);
    
    // Update conversion with job ID
    await Conversion.findByIdAndUpdate(conversion._id, {
      jobId: job.id
    });
    
    // Get queue statistics to estimate wait time
    const queueStats = await queueService.getQueueStats();
    
    // Get queue statistics
    const waitingJobs = queueStats.waiting || 0;
    
    // Get file type for estimation
    const fileType = conversionType === 'pdf-to-docx' ? 'pdf' : 'docx';
    
    // Account for user tier in queue position calculation
    // Higher tier users essentially "skip the line" in our estimation
    const effectiveQueuePosition = waitingJobs * {
      'enterprise': 0.2, // Enterprise users effectively see only 20% of the actual queue
      'premium': 0.5,
      'basic': 0.8,
      'free': 1.0
    }[userTier] || 1.0;
    
    // Estimate conversion time using our more sophisticated algorithm
    const estimatedTime = estimateConversionTime({
      fileType, 
      fileSize: sourceFile.size,
      quality,
      queuePosition: Math.round(effectiveQueuePosition)
    });
    
    logger.info(`Conversion job queued`, {
      jobId: job.id,
      conversionId: conversion._id,
      conversionType,
      userTier,
      estimatedTime,
      queuePosition: waitingJobs,
      fileSize
    });
    
    // Send notification that job is queued
    notificationService.sendConversionStatusNotification(
      userId,
      conversion._id.toString(),
      'pending',
      {
        jobId: job.id,
        estimatedTime,
        queuePosition: waitingJobs
      }
    );
    
    return {
      conversionId: conversion._id.toString(),
      jobId: job.id,
      estimatedTime
    };
  } catch (error) {
    logger.error('Failed to start conversion', error);
    throw error;
  }
}

/**
 * Get conversion status
 */
export async function getConversionStatus(conversionId: string, userId: string): Promise<any> {
  const conversion = await Conversion.findById(conversionId);
  
  if (!conversion) {
    throw new Error('Conversion not found');
  }
  
  // Verify the conversion belongs to the user
  if (conversion.userId.toString() !== userId) {
    throw new Error('Access denied to conversion');
  }
  
  // Get source file information
  const sourceFile = await File.findById(conversion.sourceFileId);
  
  // Get result file information if available
  let resultFile = null;
  if (conversion.resultFileId) {
    resultFile = await File.findById(conversion.resultFileId);
  }
  
  // Return conversion status with detailed information
  return {
    id: conversion._id,
    status: conversion.status,
    conversionType: conversion.conversionType,
    createdAt: conversion.createdAt,
    processingStartedAt: conversion.processingStartedAt,
    processingEndedAt: conversion.processingEndedAt,
    completedAt: conversion.completedAt,
    error: conversion.error,
    pageCount: conversion.pageCount,
    quality: conversion.quality,
    preserveFormatting: conversion.preserveFormatting,
    sourceFile: sourceFile ? {
      id: sourceFile._id,
      filename: sourceFile.originalFilename,
      size: sourceFile.size,
      mimeType: sourceFile.mimeType
    } : null,
    resultFile: resultFile ? {
      id: resultFile._id,
      filename: resultFile.originalFilename,
      size: resultFile.size,
      mimeType: resultFile.mimeType
    } : null
  };
}

/**
 * Get all conversions for a user
 */
export async function getUserConversions(
  userId: string,
  page = 1,
  limit = 10,
  status: string | null = null
): Promise<{
  conversions: any[];
  total: number;
  page: number;
  totalPages: number;
}> {
  // Build query
  const query: any = { userId };
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Get total count
  const total = await Conversion.countDocuments(query);
  
  // Get conversions with pagination
  const conversions = await Conversion.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sourceFileId', 'originalFilename size mimeType')
    .populate('resultFileId', 'originalFilename size mimeType');
  
  // Calculate total pages
  const totalPages = Math.ceil(total / limit);
  
  // Map conversions to a simplified format
  const mappedConversions = conversions.map(conversion => ({
    id: conversion._id,
    status: conversion.status,
    conversionType: conversion.conversionType,
    createdAt: conversion.createdAt,
    completedAt: conversion.completedAt,
    error: conversion.error,
    quality: conversion.quality,
    pageCount: conversion.pageCount,
    sourceFile: conversion.sourceFileId ? {
      id: (conversion.sourceFileId as any)._id,
      filename: (conversion.sourceFileId as any).originalFilename,
      size: (conversion.sourceFileId as any).size,
      mimeType: (conversion.sourceFileId as any).mimeType
    } : null,
    resultFile: conversion.resultFileId ? {
      id: (conversion.resultFileId as any)._id,
      filename: (conversion.resultFileId as any).originalFilename,
      size: (conversion.resultFileId as any).size,
      mimeType: (conversion.resultFileId as any).mimeType
    } : null
  }));
  
  return {
    conversions: mappedConversions,
    total,
    page,
    totalPages
  };
}

/**
 * Cancel a conversion
 */
export async function cancelConversion(conversionId: string, userId: string): Promise<boolean> {
  const conversion = await Conversion.findById(conversionId);
  
  if (!conversion) {
    throw new Error('Conversion not found');
  }
  
  // Verify the conversion belongs to the user
  if (conversion.userId.toString() !== userId) {
    throw new Error('Access denied to conversion');
  }
  
  // Only pending or processing conversions can be canceled
  if (conversion.status !== 'pending' && conversion.status !== 'processing') {
    throw new Error(`Cannot cancel conversion with status: ${conversion.status}`);
  }
  
  // If job ID exists, remove it from the queue
  if (conversion.jobId) {
    await queueService.removeJob(conversion.jobId);
  }
  
  // Update conversion status to failed with cancellation message
  await Conversion.findByIdAndUpdate(conversionId, {
    status: 'failed',
    error: 'Canceled by user',
    processingEndedAt: new Date()
  });
  
  logger.info(`Conversion canceled by user`, {
    conversionId,
    userId
  });
  
  return true;
}

/**
 * Estimate conversion time based on file type, size, quality, and queue position
 * @param params Parameters for the estimation
 * @returns Estimated time in milliseconds
 */
export function estimateConversionTime({
  fileType,
  fileSize,
  quality,
  queuePosition
}: {
  fileType: 'pdf' | 'docx';
  fileSize: number;
  quality: ConversionQuality;
  queuePosition: number;
}): number {
  // Base time based on file size (bytes to MB)
  const fileSizeMB = Math.max(0.1, fileSize / (1024 * 1024));
  
  // Base processing rates (ms per MB) - these are approximations and can be tuned
  const processingRates = {
    pdf: {
      high: 2500,    // PDF to DOCX with high quality is more intensive
      standard: 1200  // PDF to DOCX with standard quality is faster
    },
    docx: {
      high: 2000,    // DOCX to PDF with high quality
      standard: 1000  // DOCX to PDF with standard quality
    }
  };
  
  // Select appropriate rate
  const ratePerMB = processingRates[fileType][quality];
  
  // Calculate base processing time
  const baseProcessingTime = fileSizeMB * ratePerMB;
  
  // Apply log scale to prevent unreasonable times for very large files
  // This accounts for the fact that processing time doesn't scale linearly with file size
  const scaledProcessingTime = baseProcessingTime * (1 + 0.1 * Math.log10(Math.max(1, fileSizeMB)));
  
  // Queue delay - each position in queue adds delay
  // Diminishing returns with deep queue positions (first few positions matter more)
  const queueDelay = queuePosition === 0 ? 0 : 15000 * Math.min(queuePosition, 5) + 5000 * Math.max(0, queuePosition - 5);
  
  // Minimum time threshold to ensure we don't show unrealistically fast times
  const minimumTime = 3000; // 3 seconds minimum
  
  // Total estimated time
  const totalEstimatedTime = Math.max(minimumTime, scaledProcessingTime + queueDelay);
  
  return Math.round(totalEstimatedTime);
}

export default {
  startConversion,
  getConversionStatus,
  getUserConversions,
  cancelConversion,
  estimateConversionTime
};