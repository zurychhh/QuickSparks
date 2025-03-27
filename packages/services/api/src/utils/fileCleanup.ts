import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import File from '@models/file.model';
import { secureDeleteFile } from '@utils/fileStorage';
import { createLogger } from '@utils/logger';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const logger = createLogger('fileCleanup');

/**
 * Clean up expired files
 */
export const cleanupExpiredFiles = async (): Promise<void> => {
  logger.info('Starting expired file cleanup process');
  
  try {
    // Find expired files in database
    const expiredFiles = await File.find({
      expiresAt: { $lt: new Date() },
      // Only consider files that haven't been marked as deleted
      isDeleted: { $ne: true },
    }).limit(100);
    
    logger.info(`Found ${expiredFiles.length} expired files to clean up`);
    
    // Process files
    for (const file of expiredFiles) {
      try {
        const filePath = file.path;
        
        // Attempt to securely delete the file
        const deleted = await secureDeleteFile(filePath);
        
        if (deleted) {
          // Update database record
          file.isDeleted = true;
          file.deletedAt = new Date();
          await file.save();
          
          logger.info(`Cleaned up expired file: ${filePath}`);
        } else {
          logger.warn(`Failed to delete expired file: ${filePath}`);
        }
      } catch (error) {
        logger.error(`Error while cleaning up file ${file.filename}`, error);
      }
    }
    
    logger.info('Expired file cleanup completed');
  } catch (error) {
    logger.error('Error during file cleanup', error);
  }
};

/**
 * Find and clean up orphaned files
 * These are files on disk that aren't referenced in the database
 */
export const cleanupOrphanedFiles = async (): Promise<void> => {
  logger.info('Starting orphaned file cleanup process');
  
  try {
    // Get the base uploads directory
    const uploadsDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
    
    // Get all user directories
    const userDirs = await readdir(uploadsDir);
    
    let processedFiles = 0;
    let orphanedFilesRemoved = 0;
    
    // Process each user directory
    for (const userId of userDirs) {
      const userDir = path.join(uploadsDir, userId);
      
      // Skip if not a directory
      try {
        const dirStat = await stat(userDir);
        if (!dirStat.isDirectory()) continue;
      } catch (error) {
        continue;
      }
      
      // Get all files in user directory
      const files = await readdir(userDir);
      
      // Check each file
      for (const filename of files) {
        processedFiles++;
        
        // Skip temporary files from multer
        if (filename.startsWith('.multer')) continue;
        
        const filePath = path.join(userDir, filename);
        
        // Find if file exists in database
        const fileExists = await File.findOne({ filename });
        
        // If file doesn't exist in database, it's orphaned
        if (!fileExists) {
          try {
            // Delete orphaned file
            await secureDeleteFile(filePath);
            orphanedFilesRemoved++;
            logger.info(`Removed orphaned file: ${filePath}`);
          } catch (error) {
            logger.error(`Failed to remove orphaned file: ${filePath}`, error);
          }
        }
        
        // Limit number of files processed in one run to avoid long-running tasks
        if (processedFiles >= 1000) {
          logger.info('Reached file processing limit, will continue on next run');
          break;
        }
      }
    }
    
    logger.info(`Orphaned file cleanup completed. Processed ${processedFiles} files, removed ${orphanedFilesRemoved} orphaned files`);
  } catch (error) {
    logger.error('Error during orphaned file cleanup', error);
  }
};

/**
 * Schedule file cleanup jobs
 */
export const scheduleFileCleanup = (): void => {
  // Schedule expired file cleanup to run every hour
  setInterval(() => {
    cleanupExpiredFiles().catch(error => {
      logger.error('Scheduled expired file cleanup failed', error);
    });
  }, 60 * 60 * 1000); // 1 hour
  
  // Schedule orphaned file cleanup to run once a day
  setInterval(() => {
    cleanupOrphanedFiles().catch(error => {
      logger.error('Scheduled orphaned file cleanup failed', error);
    });
  }, 24 * 60 * 60 * 1000); // 24 hours
  
  logger.info('File cleanup jobs scheduled');
};