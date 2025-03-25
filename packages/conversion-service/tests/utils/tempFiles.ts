import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Directory for temporary test files
const TEST_TEMP_DIR = path.join(__dirname, '..', 'temp');
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

// Available fixture types
export type FixtureType = 'simple' | 'text_heavy' | 'formatted' | 'with_images' | 'with_tables';

/**
 * Ensure temp directory exists
 */
export function ensureTempDir(): string {
  if (!fs.existsSync(TEST_TEMP_DIR)) {
    fs.mkdirSync(TEST_TEMP_DIR, { recursive: true });
  }
  return TEST_TEMP_DIR;
}

/**
 * Create a temporary file path
 */
export function getTempFilePath(extension: string): string {
  ensureTempDir();
  const filename = `test-${uuidv4()}${extension}`;
  return path.join(TEST_TEMP_DIR, filename);
}

/**
 * Clean up temporary test files
 */
export function cleanupTempFiles(): void {
  if (fs.existsSync(TEST_TEMP_DIR)) {
    const files = fs.readdirSync(TEST_TEMP_DIR);
    
    for (const file of files) {
      fs.unlinkSync(path.join(TEST_TEMP_DIR, file));
    }
    
    fs.rmdirSync(TEST_TEMP_DIR);
  }
}

/**
 * Create a text file for testing
 */
export function createTextFile(content: string): string {
  const filePath = getTempFilePath('.txt');
  fs.writeFileSync(filePath, content);
  return filePath;
}

/**
 * Check if file exists and has content
 */
export function fileHasContent(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  const stats = fs.statSync(filePath);
  return stats.isFile() && stats.size > 0;
}

/**
 * Get path to a PDF fixture file
 * @param type The type of PDF fixture to get
 * @returns Path to the fixture file
 */
export function getPdfFixturePath(type: FixtureType = 'simple'): string {
  const fixturePath = path.join(FIXTURES_DIR, `${type}.pdf`);
  
  // Fall back to simple if the requested fixture doesn't exist
  if (!fs.existsSync(fixturePath)) {
    return path.join(FIXTURES_DIR, 'simple.pdf');
  }
  
  return fixturePath;
}

/**
 * Get path to a DOCX fixture file
 * @param type The type of DOCX fixture to get
 * @returns Path to the fixture file
 */
export function getDocxFixturePath(type: FixtureType = 'simple'): string {
  const fixturePath = path.join(FIXTURES_DIR, `${type}.docx`);
  
  // Fall back to simple if the requested fixture doesn't exist
  if (!fs.existsSync(fixturePath)) {
    return path.join(FIXTURES_DIR, 'simple.docx');
  }
  
  return fixturePath;
}

/**
 * Create a copy of a PDF fixture in the temp directory
 * @param type The type of PDF fixture to copy
 * @returns Path to the copied fixture
 */
export function copyPdfFixture(type: FixtureType = 'simple'): string {
  const sourcePath = getPdfFixturePath(type);
  const destPath = getTempFilePath('.pdf');
  
  fs.copyFileSync(sourcePath, destPath);
  return destPath;
}

/**
 * Create a copy of a DOCX fixture in the temp directory
 * @param type The type of DOCX fixture to copy
 * @returns Path to the copied fixture
 */
export function copyDocxFixture(type: FixtureType = 'simple'): string {
  const sourcePath = getDocxFixturePath(type);
  const destPath = getTempFilePath('.docx');
  
  fs.copyFileSync(sourcePath, destPath);
  return destPath;
}