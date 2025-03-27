import { Readable, Writable, Transform } from 'stream';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Request, Response } from 'express';
import logger from './logger';
import { getErrorMessage } from './errorHandling';

/**
 * Creates a read stream with automatic cleanup on error
 * @param {string} filePath - Path to the file
 * @param {object} [options] - Read stream options
 * @returns {Readable} - Read stream
 */
export const createSafeReadStream = (
  filePath: string,
  options?: Parameters<typeof createReadStream>[1]
): Readable => {
  const stream = createReadStream(filePath, options);

  stream.on('error', (error) => {
    logger.error(`Read stream error: ${getErrorMessage(error)}`);
    if (!stream.destroyed) stream.destroy();
  });

  return stream;
};

/**
 * Creates a write stream with automatic cleanup on error
 * @param {string} filePath - Path to the file
 * @param {object} [options] - Write stream options
 * @returns {Writable} - Write stream
 */
export const createSafeWriteStream = (
  filePath: string,
  options?: Parameters<typeof createWriteStream>[1]
): Writable => {
  const stream = createWriteStream(filePath, options);

  stream.on('error', (error) => {
    logger.error(`Write stream error: ${getErrorMessage(error)}`);
    if (!stream.destroyed) stream.destroy();
  });

  return stream;
};

/**
 * Safely processes streams with proper cleanup
 * @param {Readable} readStream - Input stream
 * @param {Writable} writeStream - Output stream
 * @param {Transform} [transformStream] - Optional transform stream
 * @returns {Promise<void>}
 */
export const safeStreamPipeline = async (
  readStream: Readable,
  writeStream: Writable,
  transformStream?: Transform
): Promise<void> => {
  try {
    if (transformStream) {
      await pipeline(readStream, transformStream, writeStream);
    } else {
      await pipeline(readStream, writeStream);
    }
  } catch (error) {
    // Close streams in case of error
    if (!readStream.destroyed) readStream.destroy();
    if (!writeStream.destroyed) writeStream.destroy();
    if (transformStream && !transformStream.destroyed) transformStream.destroy();

    throw error;
  }
};

/**
 * Safely sends a file stream as HTTP response with proper error handling
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Readable} fileStream - File stream to send
 * @param {string} filename - Original filename
 * @param {string} contentType - Content type
 * @returns {Promise<void>}
 */
export const sendFileStream = (
  req: Request,
  res: Response,
  fileStream: Readable,
  filename: string,
  contentType: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    // Handle stream errors
    fileStream.on('error', (error) => {
      // If headers already sent, we can't send proper error response
      if (res.headersSent) {
        logger.error('Error streaming file after headers sent:', error);

        // Destroy the stream and end the response
        if (!fileStream.destroyed) fileStream.destroy();
        if (!res.writableEnded) res.end();

        reject(error);
      } else {
        // We can still send a proper error response
        res.status(500).json({
          error: 'STREAM_ERROR',
          message: 'An error occurred while streaming the file'
        });

        reject(error);
      }
    });

    // Handle client disconnect
    req.on('close', () => {
      if (!fileStream.destroyed) fileStream.destroy();
      resolve();
    });

    // Handle successful completion
    fileStream.on('end', () => {
      resolve();
    });

    // Pipe file stream to response
    fileStream.pipe(res);
  });
};