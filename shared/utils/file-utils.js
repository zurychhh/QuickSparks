/**
 * File utilities for QuickSparks services
 * 
 * Provides common file handling operations used across services.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const crypto = require('crypto');

// Promisified versions of fs functions
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} dirPath - Directory path to ensure
 * @returns {Promise<void>}
 */
async function ensureDir(dirPath) {
  try {
    await stat(dirPath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await mkdir(dirPath, { recursive: true });
    } else {
      throw err;
    }
  }
}

/**
 * Generates a unique filename with timestamp and random suffix
 * @param {string} originalName - Original file name
 * @returns {string} Generated unique filename
 */
function generateUniqueFilename(originalName) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName);
  const basename = path.basename(originalName, ext);
  
  return `${basename}-${timestamp}-${random}${ext}`;
}

/**
 * Safely writes file to disk ensuring directory exists
 * @param {string} filePath - Path to write file to
 * @param {Buffer|string} data - File data to write
 * @returns {Promise<void>}
 */
async function safeWriteFile(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, data);
}

/**
 * Safely deletes a file, ignoring errors if file doesn't exist
 * @param {string} filePath - Path to file to delete
 * @returns {Promise<boolean>} True if file was deleted, false if not found
 */
async function safeDeleteFile(filePath) {
  try {
    await unlink(filePath);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }
    throw err;
  }
}

/**
 * Gets MIME type from file extension
 * @param {string} filename - Filename with extension
 * @returns {string} MIME type or 'application/octet-stream' if unknown
 */
function getMimeTypeFromFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Checks if a file exists
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>} True if file exists, false otherwise
 */
async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }
    throw err;
  }
}

/**
 * Gets file size in bytes
 * @param {string} filePath - Path to file
 * @returns {Promise<number>} File size in bytes
 */
async function getFileSize(filePath) {
  const stats = await stat(filePath);
  return stats.size;
}

/**
 * Safely reads all files from a directory
 * @param {string} dirPath - Directory path
 * @param {RegExp} [pattern] - Optional pattern to filter files
 * @returns {Promise<string[]>} Array of file paths
 */
async function readDirFiles(dirPath, pattern = null) {
  try {
    await ensureDir(dirPath);
    const files = await readdir(dirPath);
    
    if (pattern) {
      return files
        .filter(file => pattern.test(file))
        .map(file => path.join(dirPath, file));
    }
    
    return files.map(file => path.join(dirPath, file));
  } catch (err) {
    return [];
  }
}

module.exports = {
  ensureDir,
  generateUniqueFilename,
  safeWriteFile,
  safeDeleteFile,
  getMimeTypeFromFilename,
  fileExists,
  getFileSize,
  readDirFiles,
  readFile,
  writeFile,
};