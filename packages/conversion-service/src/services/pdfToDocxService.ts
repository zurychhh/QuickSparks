import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import * as pdf2json from 'pdf2json';
import * as pdfjs from 'pdfjs-dist';
import logger from '../utils/logger';
import { ConversionQuality } from '../types/conversion';

// Set up pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = path.join(__dirname, '../../node_modules/pdfjs-dist/build/pdf.worker.js');

/**
 * Convert PDF to DOCX using different libraries based on quality setting
 * @param inputPath Path to the input PDF file
 * @param outputPath Path to save the output DOCX file
 * @param quality Quality level of the conversion (standard or high)
 * @param preserveFormatting Whether to preserve formatting during conversion
 * @returns Result object with success status, error, and metadata
 */
export async function convertPdfToDocx(
  inputPath: string,
  outputPath: string,
  quality: ConversionQuality = 'high',
  preserveFormatting = true
): Promise<{
  success: boolean;
  error?: string;
  pageCount?: number;
  conversionTime?: number;
}> {
  const startTime = Date.now();
  
  try {
    // Make sure input file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }
    
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Choose conversion method based on quality setting
    if (quality === 'high') {
      return await convertWithPdfJS(inputPath, outputPath, preserveFormatting);
    } else {
      return await convertWithPdf2Json(inputPath, outputPath, preserveFormatting);
    }
  } catch (error) {
    logger.error('PDF to DOCX conversion failed', { error, inputPath });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during conversion',
      conversionTime: Date.now() - startTime
    };
  }
}

/**
 * Convert PDF to DOCX using PDF.js (higher quality, but slower)
 */
async function convertWithPdfJS(
  inputPath: string,
  outputPath: string,
  preserveFormatting: boolean
): Promise<{
  success: boolean;
  error?: string;
  pageCount?: number;
  conversionTime?: number;
}> {
  const startTime = Date.now();
  
  try {
    // Load the PDF document
    const data = new Uint8Array(fs.readFileSync(inputPath));
    const pdfDoc = await pdfjs.getDocument({ data }).promise;
    const pageCount = pdfDoc.numPages;
    
    // Document content
    const docContent: any[] = [];
    
    // Add document title
    const title = path.basename(inputPath, '.pdf');
    docContent.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      })
    );
    
    // Process each page
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdfDoc.getPage(i);
      
      // Add page heading if multi-page document
      if (pageCount > 1) {
        docContent.push(
          new Paragraph({
            text: `Page ${i}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            pageBreakBefore: i > 1
          })
        );
      }
      
      // Extract text content
      const textContent = await page.getTextContent();
      const textItems = textContent.items;
      
      // Group text items into lines and paragraphs
      let currentY: number | null = null;
      let currentLine: string[] = [];
      let currentFontSize: number | null = null;
      
      for (const item of textItems) {
        const textItem = item as any;
        
        // Skip empty text
        if (!textItem.str.trim()) continue;
        
        // Check if this is a new line
        if (currentY === null || 
            Math.abs(textItem.transform[5] - currentY) > 2 || 
            (currentFontSize !== null && Math.abs(textItem.height - currentFontSize) > 2)) {
          
          // Add the current line as a paragraph
          if (currentLine.length > 0) {
            const text = currentLine.join(' ').trim();
            
            if (text) {
              // Determine if this is a heading based on font size
              if (currentFontSize && currentFontSize > 14) {
                docContent.push(
                  new Paragraph({
                    text,
                    heading: currentFontSize > 18 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 }
                  })
                );
              } else {
                docContent.push(
                  new Paragraph({
                    text,
                    spacing: { after: 100 }
                  })
                );
              }
            }
          }
          
          // Start a new line
          currentLine = [textItem.str];
          currentY = textItem.transform[5];
          currentFontSize = textItem.height;
        } else {
          // Continue the current line
          currentLine.push(textItem.str);
        }
      }
      
      // Add the last line as a paragraph
      if (currentLine.length > 0) {
        const text = currentLine.join(' ').trim();
        
        if (text) {
          docContent.push(
            new Paragraph({
              text,
              spacing: { after: 100 }
            })
          );
        }
      }
    }
    
    // Create the DOCX document
    const doc = new Document({
      title,
      description: `Converted from PDF: ${title}`,
      sections: [{
        properties: {},
        children: docContent
      }]
    });
    
    // Save the document
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    
    const conversionTime = Date.now() - startTime;
    
    return {
      success: true,
      pageCount,
      conversionTime
    };
  } catch (error) {
    logger.error('PDF.js conversion failed', { error, inputPath });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during PDF.js conversion',
      conversionTime: Date.now() - startTime
    };
  }
}

/**
 * Convert PDF to DOCX using pdf2json (faster, but lower quality)
 */
async function convertWithPdf2Json(
  inputPath: string,
  outputPath: string,
  preserveFormatting: boolean
): Promise<{
  success: boolean;
  error?: string;
  pageCount?: number;
  conversionTime?: number;
}> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    try {
      // Create a new PDF parser
      const pdfParser = new pdf2json.default();
      
      // Handle parsing error
      pdfParser.on('pdfParser_dataError', (error: Error) => {
        logger.error('pdf2json parsing error', { error, inputPath });
        resolve({
          success: false,
          error: error.message,
          conversionTime: Date.now() - startTime
        });
      });
      
      // Handle successful parsing
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          const pageCount = pdfData.Pages.length;
          
          // Document content
          const docContent: any[] = [];
          
          // Add document title
          const title = path.basename(inputPath, '.pdf');
          docContent.push(
            new Paragraph({
              text: title,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 }
            })
          );
          
          // Process each page
          pdfData.Pages.forEach((page: any, pageIndex: number) => {
            // Add page heading if multi-page document
            if (pageCount > 1) {
              docContent.push(
                new Paragraph({
                  text: `Page ${pageIndex + 1}`,
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                  pageBreakBefore: pageIndex > 0
                })
              );
            }
            
            // Group text elements by their Y position to form lines
            const textsByY: {[key: number]: any[]} = {};
            
            page.Texts.forEach((text: any) => {
              const y = Math.round(text.y);
              
              if (!textsByY[y]) {
                textsByY[y] = [];
              }
              
              textsByY[y].push(text);
            });
            
            // Sort text elements by X position within each line
            Object.keys(textsByY).forEach((y) => {
              textsByY[Number(y)].sort((a, b) => a.x - b.x);
            });
            
            // Convert lines to paragraphs
            const yPositions = Object.keys(textsByY).map(Number).sort((a, b) => a - b);
            
            yPositions.forEach((y) => {
              // Decode and combine text elements in this line
              const lineTexts = textsByY[y].map((text: any) => {
                if (!text.R || !text.R.length) return '';
                return decodeURIComponent(text.R[0].T);
              });
              
              const lineText = lineTexts.join(' ').trim();
              
              if (lineText) {
                // Check if this is a heading based on font style
                const isBold = textsByY[y].some((text: any) => 
                  text.R && text.R[0] && text.R[0].S && 
                  (text.R[0].S >> 2 & 1) // Check bold bit
                );
                
                const fontSize = textsByY[y][0]?.R?.[0]?.TS[0] || 10;
                
                if (isBold || fontSize > 14) {
                  docContent.push(
                    new Paragraph({
                      text: lineText,
                      heading: fontSize > 16 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
                      spacing: { before: 200, after: 100 }
                    })
                  );
                } else {
                  docContent.push(
                    new Paragraph({
                      text: lineText,
                      spacing: { after: 100 }
                    })
                  );
                }
              }
            });
          });
          
          // Create the DOCX document
          const doc = new Document({
            title,
            description: `Converted from PDF: ${title}`,
            sections: [{
              properties: {},
              children: docContent
            }]
          });
          
          // Create output directory if it doesn't exist
          const outputDir = path.dirname(outputPath);
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          
          // Save the document
          Packer.toBuffer(doc).then(buffer => {
            fs.writeFileSync(outputPath, buffer);
            
            resolve({
              success: true,
              pageCount,
              conversionTime: Date.now() - startTime
            });
          }).catch(error => {
            logger.error('Error creating DOCX file', { error });
            resolve({
              success: false,
              error: 'Failed to create DOCX file',
              conversionTime: Date.now() - startTime
            });
          });
        } catch (error) {
          logger.error('Error processing PDF data', { error });
          resolve({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error processing PDF data',
            conversionTime: Date.now() - startTime
          });
        }
      });
      
      // Load and parse the PDF file
      pdfParser.loadPDF(inputPath);
      
    } catch (error) {
      logger.error('pdf2json conversion failed', { error, inputPath });
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during pdf2json conversion',
        conversionTime: Date.now() - startTime
      });
    }
  });
}

export default {
  convertPdfToDocx
};