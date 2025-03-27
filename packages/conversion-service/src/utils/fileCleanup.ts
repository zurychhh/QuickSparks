import fs from 'fs';
import path from 'path';
import File from '../models/file.model';
import { IFileDocument } from '../models/file.model';
import fileStorage from './fileStorage';
import logger from './logger';
import env from '../config/env';
import { isFileDocument } from './typeHelpers';

/**
 * Cleanup expired files
 */
export async function cleanupExpiredFiles(): Promise<{
  deletedCount: number;
  errors: number;
}> {
  try {
    logger.info('Starting cleanup of expired files');
    
    // Find expired files that haven't been deleted yet
    const now = new Date();
    const expiredFiles = await File.find({
      expiresAt: { $lt: now },
      isDeleted: false
    });
    
    logger.info(`Found ${expiredFiles.length} expired files to clean up`);
    
    let deletedCount = 0;
    let errors = 0;
    
    // Process each expired file
    for (const file of expiredFiles) {
      try {
        // Ensure file is a valid FileDocument
        if (!isFileDocument(file)) {
          logger.error(`Invalid file document: ${file._id}`);
          errors++;
          continue;
        }
        
        // Check if file exists
        if (fs.existsSync(file.path)) {
          // Securely delete the file
          await fileStorage.secureDeleteFile(file.path);
        }
        
        // Mark file as deleted in the database
        file.isDeleted = true;
        file.deletedAt = new Date();
        await file.save();
        
        deletedCount++;
      } catch (error) {
        errors++;
        logger.error(`Error cleaning up file ${file._id}`, error);
      }
    }
    
    logger.info(`Cleanup completed. Deleted ${deletedCount} files with ${errors} errors`);
    
    return { deletedCount, errors };
  } catch (error) {
    logger.error('Error in cleanup process', error);
    return { deletedCount: 0, errors: 1 };
  }
}

/**
 * Clean up orphaned files that exist on disk but not in database
 */
export async function cleanupOrphanedFiles(
  directory: string = process.cwd()
): Promise<{
  scannedCount: number;
  orphanedCount: number;
  deletedCount: number;
  errors: number;
}> {
  try {
    logger.info(`Starting cleanup of orphaned files in ${directory}`);
    
    let scannedCount = 0;
    let orphanedCount = 0;
    let deletedCount = 0;
    let errors = 0;
    
    // Function to scan directory recursively
    const scanDirectory = async (dir: string) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          // Recurse into subdirectories
          await scanDirectory(itemPath);
        } else if (stats.isFile()) {
          scannedCount++;
          
          // Check if this is a system/temporary file
          if (item.startsWith('.') || item.endsWith('.tmp')) {
            continue;
          }
          
          // Check if file exists in database
          const dbFile = await File.findOne({
            $or: [
              { path: itemPath },
              { path: itemPath.replace(/\\/g, '/') }, // Handle Windows path separators
            ]
          });
          
          if (!dbFile) {
            orphanedCount++;
            try {
              // Delete orphaned file
              await fileStorage.secureDeleteFile(itemPath);
              deletedCount++;
            } catch (error) {
              errors++;
              logger.error(`Error deleting orphaned file ${itemPath}`, error);
            }
          }
        }
      }
    };
    
    // Scan uploads and outputs directories
    await scanDirectory(path.join(process.cwd(), env.UPLOADS_DIR));
    await scanDirectory(path.join(process.cwd(), env.OUTPUTS_DIR));
    await scanDirectory(path.join(process.cwd(), env.THUMBNAILS_DIR));
    await scanDirectory(path.join(process.cwd(), env.TEMP_DIR));
    
    logger.info(`Orphaned files cleanup completed. Scanned: ${scannedCount}, Orphaned: ${orphanedCount}, Deleted: ${deletedCount}, Errors: ${errors}`);
    
    return { scannedCount, orphanedCount, deletedCount, errors };
  } catch (error) {
    logger.error('Error in orphaned files cleanup process', error);
    return { scannedCount: 0, orphanedCount: 0, deletedCount: 0, errors: 1 };
  }
}

/**
 * Schedule periodic cleanup
 */
export function scheduleFileCleanup(intervalMs: number = env.CLEANUP_INTERVAL): NodeJS.Timeout {
  logger.info(`Scheduling file cleanup every ${intervalMs / 1000} seconds`);
  
  // Run cleanup immediately on startup
  setTimeout(() => {
    cleanupExpiredFiles().catch(error => {
      logger.error('Error in scheduled file cleanup', error);
    });
  }, 5000); // Wait 5 seconds after startup
  
  // Schedule periodic cleanup
  const intervalId = setInterval(async () => {
    try {
      await cleanupExpiredFiles();
      
      // Run orphaned file cleanup once a day
      const now = new Date();
      if (now.getHours() === 3) { // Run at 3 AM
        await cleanupOrphanedFiles();
      }
    } catch (error) {
      logger.error('Error in scheduled file cleanup', error);
    }
  }, intervalMs);
  
  return intervalId;
}

export default {
  cleanupExpiredFiles,
  cleanupOrphanedFiles,
  scheduleFileCleanup,
};