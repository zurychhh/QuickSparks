import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import fileStorage from '../utils/fileStorage';
import logger from '../utils/logger';
import File from '../models/file.model';
import env from '../config/env';

const execPromise = util.promisify(exec);

/**
 * Generate a thumbnail for a PDF file
 */
export async function generatePdfThumbnail(
  filePath: string,
  userId: string,
  page: number = 1,
  width: number = 300
): Promise<{ thumbnailPath: string; thumbnailBuffer: Buffer }> {
  try {
    // Read and decrypt file
    const fileBuffer = await fileStorage.readFileSecurely(filePath, userId);
    
    // Load PDF document
    const pdfDoc = await PDFDocument.load(fileBuffer);
    
    // Ensure requested page exists
    if (page < 1 || page > pdfDoc.getPageCount()) {
      page = 1;
    }
    
    // Extract the requested page
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [page - 1]);
    newPdf.addPage(copiedPage);
    
    // Save single-page PDF to a temporary file
    const tempPdfPath = path.join(
      process.cwd(), 
      env.TEMP_DIR, 
      `${fileStorage.generateSecureFilename('temp-thumbnail.pdf')}`
    );
    
    fs.writeFileSync(tempPdfPath, await newPdf.save());
    
    // Convert PDF to PNG using pdftoppm (requires poppler-utils)
    const outputImagePath = tempPdfPath.replace('.pdf', '.png');
    
    await execPromise(`pdftoppm -png -singlefile -scale-to ${width} ${tempPdfPath} ${tempPdfPath.replace('.pdf', '')}`);
    
    // Read the generated PNG file
    const thumbnailBuffer = fs.readFileSync(outputImagePath);
    
    // Generate a permanent path for the thumbnail
    const thumbnailsDir = await fileStorage.ensureUserStorageDirectory(userId, 'thumbnails');
    const thumbnailFilename = fileStorage.generateSecureFilename('thumbnail.png');
    const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
    
    // Optimize and save the thumbnail
    await sharp(thumbnailBuffer)
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    // Clean up temporary files
    try {
      fs.unlinkSync(tempPdfPath);
      fs.unlinkSync(outputImagePath);
    } catch (cleanupError) {
      logger.warn('Error cleaning up temporary files', cleanupError);
    }
    
    return { thumbnailPath, thumbnailBuffer };
  } catch (error) {
    logger.error('Error generating PDF thumbnail', error);
    throw new Error('Failed to generate PDF thumbnail');
  }
}

/**
 * Generate a thumbnail for a DOCX file
 */
export async function generateDocxThumbnail(
  filePath: string,
  userId: string,
  width: number = 300
): Promise<{ thumbnailPath: string; thumbnailBuffer: Buffer }> {
  try {
    // For DOCX, we'll use libreoffice to first convert to PDF then generate thumbnail
    // Read and decrypt file
    const fileBuffer = await fileStorage.readFileSecurely(filePath, userId);
    
    // Create temporary directory
    const tempDir = path.join(process.cwd(), env.TEMP_DIR, fileStorage.generateSecureFilename('temp-dir'));
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Write temporary DOCX file
    const tempDocxPath = path.join(tempDir, 'temp.docx');
    fs.writeFileSync(tempDocxPath, fileBuffer);
    
    // Convert DOCX to PDF using LibreOffice
    await execPromise(`libreoffice --headless --convert-to pdf --outdir ${tempDir} ${tempDocxPath}`);
    const tempPdfPath = path.join(tempDir, 'temp.pdf');
    
    // Use the PDF thumbnail generation
    const outputImagePath = tempPdfPath.replace('.pdf', '.png');
    
    await execPromise(`pdftoppm -png -singlefile -scale-to ${width} ${tempPdfPath} ${tempPdfPath.replace('.pdf', '')}`);
    
    // Read the generated PNG file
    const thumbnailBuffer = fs.readFileSync(outputImagePath);
    
    // Generate a permanent path for the thumbnail
    const thumbnailsDir = await fileStorage.ensureUserStorageDirectory(userId, 'thumbnails');
    const thumbnailFilename = fileStorage.generateSecureFilename('thumbnail.png');
    const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
    
    // Optimize and save the thumbnail
    await sharp(thumbnailBuffer)
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    // Clean up temporary files
    try {
      fs.rm(tempDir, { recursive: true, force: true }, (err) => {
        if (err) {
          logger.warn('Error cleaning up temporary directory', err);
        }
      });
    } catch (cleanupError) {
      logger.warn('Error cleaning up temporary files', cleanupError);
    }
    
    return { thumbnailPath, thumbnailBuffer };
  } catch (error) {
    logger.error('Error generating DOCX thumbnail', error);
    throw new Error('Failed to generate DOCX thumbnail');
  }
}

/**
 * Generate thumbnail for a file
 */
export async function generateThumbnail(
  fileId: string,
  userId: string,
  options: { page?: number; width?: number } = {}
): Promise<{ thumbnailId: string; thumbnailUrl: string }> {
  try {
    // Default options
    const page = options.page || 1;
    const width = options.width || 300;
    
    // Find the file
    const file = await File.findById(fileId);
    
    if (!file) {
      throw new Error('File not found');
    }
    
    // Verify the file belongs to the user
    if (file.userId.toString() !== userId) {
      throw new Error('Access denied to file');
    }
    
    let thumbnailPath: string;
    let thumbnailBuffer: Buffer;
    
    // Generate thumbnail based on file type
    if (file.mimeType === 'application/pdf') {
      ({ thumbnailPath, thumbnailBuffer } = await generatePdfThumbnail(file.path, userId, page, width));
    } else if (
      file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimeType === 'application/msword'
    ) {
      ({ thumbnailPath, thumbnailBuffer } = await generateDocxThumbnail(file.path, userId, width));
    } else {
      throw new Error(`Unsupported file type for thumbnail generation: ${file.mimeType}`);
    }
    
    // Create thumbnail record in database
    const thumbnailFile = await File.create({
      userId,
      filename: path.basename(thumbnailPath),
      originalFilename: `thumbnail_${file.originalFilename}.jpg`,
      mimeType: 'image/jpeg',
      size: thumbnailBuffer.length,
      path: thumbnailPath,
      expiresAt: file.expiresAt, // Thumbnail expires when the original file expires
      isDeleted: false,
      encryptionMethod: 'none', // Thumbnails aren't encrypted for performance
    });
    
    // Generate a secure URL for the thumbnail
    const thumbnailUrl = `/api/thumbnails/${thumbnailFile._id}`;
    
    return {
      thumbnailId: thumbnailFile._id.toString(),
      thumbnailUrl
    };
  } catch (error) {
    logger.error('Error in thumbnail generation', error);
    throw error;
  }
}

export default {
  generateThumbnail,
  generatePdfThumbnail,
  generateDocxThumbnail
};