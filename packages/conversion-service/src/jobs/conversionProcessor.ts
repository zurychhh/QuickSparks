import { Job } from 'bullmq';
import fs from 'fs';
import path from 'path';
import { ConversionJob, ConversionResult, ConversionType } from '../types/conversion';
import pdfToDocxService from '../services/pdfToDocxService';
import docxToPdfService from '../services/docxToPdfService';
import logger from '../utils/logger';
import Conversion from '../models/conversion.model';
import File from '../models/file.model';
import fileStorage from '../utils/fileStorage';

/**
 * Process a conversion job
 * @param job The BullMQ job containing conversion details
 * @returns Result of the conversion process
 */
export async function processConversionJob(job: Job<ConversionJob>): Promise<ConversionResult> {
  const { conversionId, userId, sourceFilePath, outputFilePath, originalFilename, conversionType, quality, preserveFormatting } = job.data;
  
  logger.info(`Processing ${conversionType} job`, { 
    jobId: job.id, 
    conversionId,
    sourceFilePath
  });
  
  try {
    // Update conversion status to processing
    await Conversion.findByIdAndUpdate(conversionId, { 
      status: 'processing',
      processingStartedAt: new Date(),
      jobId: job.id
    });
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Conversion result
    let result: ConversionResult;
    
    // Choose conversion method based on conversion type
    if (conversionType === 'pdf-to-docx') {
      result = await pdfToDocxService.convertPdfToDocx(
        sourceFilePath,
        outputFilePath,
        quality,
        preserveFormatting
      );
    } else if (conversionType === 'docx-to-pdf') {
      result = await docxToPdfService.convertDocxToPdf(
        sourceFilePath,
        outputFilePath,
        quality,
        preserveFormatting
      );
    } else {
      throw new Error(`Unsupported conversion type: ${conversionType}`);
    }
    
    if (result.success) {
      // Get output file information
      const stats = fs.statSync(outputFilePath);
      
      // Determine output file MIME type
      const outputMimeType = conversionType === 'pdf-to-docx' 
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';
        
      // Generate secure output filename
      const outputExtension = conversionType === 'pdf-to-docx' ? '.docx' : '.pdf';
      const originalFilenameWithoutExt = path.basename(originalFilename, path.extname(originalFilename));
      const newOriginalFilename = `${originalFilenameWithoutExt}${outputExtension}`;
      
      // Calculate file expiration date based on user tier from job data
      const expiresAt = fileStorage.calculateFileExpiration(job.data.userTier);
      
      // Encrypt the output file
      const encryptionMetadata = await fileStorage.saveFileSecurely(
        outputFilePath + '.enc',
        fs.readFileSync(outputFilePath),
        userId
      );
      
      // Delete the unencrypted file
      fs.unlinkSync(outputFilePath);
      
      // Create a file record for the output file
      const outputFile = await File.create({
        userId,
        filename: path.basename(outputFilePath + '.enc'),
        originalFilename: newOriginalFilename,
        mimeType: outputMimeType,
        size: stats.size,
        path: outputFilePath + '.enc',
        expiresAt,
        isDeleted: false,
        encryptionMethod: encryptionMetadata.encryptionMethod,
        keyIdentifier: encryptionMetadata.keyIdentifier
      });
      
      // Update conversion record with completion info
      await Conversion.findByIdAndUpdate(conversionId, {
        status: 'completed',
        resultFileId: outputFile._id,
        completedAt: new Date(),
        processingEndedAt: new Date(),
        pageCount: result.pageCount
      });
      
      logger.info(`Conversion completed successfully`, {
        jobId: job.id,
        conversionId,
        outputFile: outputFile._id,
        conversionTime: result.conversionTime
      });
      
      // Return success result
      return {
        success: true,
        outputPath: outputFile.path,
        conversionTime: result.conversionTime,
        pageCount: result.pageCount
      };
    } else {
      // Handle conversion failure
      await Conversion.findByIdAndUpdate(conversionId, {
        status: 'failed',
        error: result.error,
        processingEndedAt: new Date()
      });
      
      logger.error(`Conversion failed`, {
        jobId: job.id,
        conversionId,
        error: result.error
      });
      
      return {
        success: false,
        error: result.error,
        conversionTime: result.conversionTime
      };
    }
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await Conversion.findByIdAndUpdate(conversionId, {
      status: 'failed',
      error: errorMessage,
      processingEndedAt: new Date()
    });
    
    logger.error(`Conversion job failed with exception`, {
      jobId: job.id,
      conversionId,
      error
    });
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

export default {
  processConversionJob
};