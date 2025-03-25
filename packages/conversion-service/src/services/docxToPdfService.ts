import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import logger from '../utils/logger';
import { ConversionQuality } from '../types/conversion';

/**
 * Convert DOCX to PDF
 * @param inputPath Path to the input DOCX file
 * @param outputPath Path to save the output PDF file
 * @param quality Quality level of the conversion (standard or high)
 * @param preserveFormatting Whether to preserve formatting during conversion
 * @returns Result object with success status, error, and metadata
 */
export async function convertDocxToPdf(
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
    
    // Extract HTML content from DOCX using mammoth
    const result = await mammoth.convertToHtml({ path: inputPath });
    const html = result.value;
    
    // Also extract raw text for fallback
    const textResult = await mammoth.extractRawText({ path: inputPath });
    const rawText = textResult.value;
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Parse HTML into structured elements
    const elements = parseHtml(html);
    
    let pageCount = 0;
    
    if (elements.length === 0) {
      // Fallback to basic text rendering if parsing fails
      pageCount = await renderRawText(pdfDoc, rawText);
    } else {
      // Render structured elements to PDF
      pageCount = await renderElements(pdfDoc, elements, preserveFormatting);
    }
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);
    
    const conversionTime = Date.now() - startTime;
    
    return {
      success: true,
      pageCount,
      conversionTime
    };
    
  } catch (error) {
    logger.error('DOCX to PDF conversion failed', { error, inputPath });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during conversion',
      conversionTime: Date.now() - startTime
    };
  }
}

/**
 * Parse HTML content and convert it to structured document elements
 */
function parseHtml(html: string): any[] {
  const elements: any[] = [];
  
  // Basic parsing of HTML tags
  // This is a simplified approach - a real implementation would use a proper HTML parser
  
  // Define patterns for different HTML elements
  const patterns = [
    { regex: /<h1[^>]*>(.*?)<\/h1>/gi, type: 'heading1' },
    { regex: /<h2[^>]*>(.*?)<\/h2>/gi, type: 'heading2' },
    { regex: /<p[^>]*>(.*?)<\/p>/gi, type: 'paragraph' },
    { regex: /<li[^>]*>(.*?)<\/li>/gi, type: 'listItem' },
    { regex: /<table[^>]*>(.*?)<\/table>/gis, type: 'table', processContent: true }
  ];
  
  // First pass - extract blocks (headings, paragraphs, etc.)
  let remainingHtml = html;
  
  // Process block-level elements
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.regex);
    let match;
    
    while ((match = regex.exec(remainingHtml)) !== null) {
      const content = match[1].trim();
      
      if (pattern.type === 'table') {
        // Process table content to extract rows and cells
        const tableElement: any = {
          type: 'table',
          rows: []
        };
        
        // Extract rows
        const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
        let rowMatch;
        const tableContent = match[1];
        
        while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
          const row: string[] = [];
          
          // Extract cells
          const cellRegex = /<t[hd][^>]*>(.*?)<\/t[hd]>/gis;
          let cellMatch;
          const rowContent = rowMatch[1];
          
          while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
            row.push(cellMatch[1].trim());
          }
          
          if (row.length > 0) {
            tableElement.rows.push(row);
          }
        }
        
        if (tableElement.rows.length > 0) {
          elements.push(tableElement);
        }
      } else if (content) {
        // Process other block elements
        // Remove any remaining HTML tags
        const processedContent = content.replace(/<[^>]*>/g, '');
        
        elements.push({
          type: pattern.type,
          text: processedContent
        });
      }
    }
  }
  
  return elements;
}

/**
 * Render raw text to PDF
 */
async function renderRawText(pdfDoc: PDFDocument, text: string): Promise<number> {
  const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontSize = 12;
  const lineHeight = fontSize * 1.2;
  const marginLeft = 50;
  const marginTop = 50;
  const marginBottom = 50;
  
  // Add first page
  let page = pdfDoc.addPage();
  const { height } = page.getSize();
  
  // Split text into lines
  const lines = text.split('\n');
  
  // Draw each line of text
  let y = height - marginTop;
  let currentPage = page;
  
  for (const line of lines) {
    if (y < marginBottom) {
      // Add a new page if we run out of space
      currentPage = pdfDoc.addPage();
      y = currentPage.getSize().height - marginTop;
    }
    
    if (line.trim()) {
      currentPage.drawText(line, {
        x: marginLeft,
        y,
        size: fontSize,
        font: regularFont,
        color: rgb(0, 0, 0),
      });
    }
    
    y -= lineHeight;
  }
  
  return pdfDoc.getPageCount();
}

/**
 * Render document elements to PDF
 */
async function renderElements(
  pdfDoc: PDFDocument, 
  elements: any[], 
  preserveFormatting: boolean
): Promise<number> {
  // Fonts for different styles
  const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  
  // Set page margins and defaults
  const marginLeft = 50;
  const marginRight = 50;
  const marginTop = 50;
  const marginBottom = 50;
  const defaultFontSize = 12;
  const defaultLineHeight = defaultFontSize * 1.2;
  
  // Add first page
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  // Track current position
  let y = height - marginTop;
  let currentPage = page;
  
  // Process each element
  for (const element of elements) {
    // Check if we need a new page
    if (y < marginBottom + 100) { // +100 for minimum space needed for a new element
      currentPage = pdfDoc.addPage();
      y = currentPage.getSize().height - marginTop;
    }
    
    switch (element.type) {
      case 'heading1':
        const h1FontSize = 24;
        const h1LineHeight = h1FontSize * 1.2;
        
        currentPage.drawText(element.text, {
          x: marginLeft,
          y,
          size: h1FontSize,
          font: boldFont,
          color: rgb(0, 0, 0)
        });
        
        y -= h1LineHeight + 10; // Add extra spacing after headings
        break;
        
      case 'heading2':
        const h2FontSize = 18;
        const h2LineHeight = h2FontSize * 1.2;
        
        currentPage.drawText(element.text, {
          x: marginLeft,
          y,
          size: h2FontSize,
          font: boldFont,
          color: rgb(0, 0, 0)
        });
        
        y -= h2LineHeight + 8; // Add extra spacing after headings
        break;
        
      case 'paragraph':
        // Simple text wrapping
        let currentLine = '';
        const lines = [];
        const words = element.text.split(' ');
        
        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const textWidth = regularFont.widthOfTextAtSize(testLine, defaultFontSize);
          
          if (textWidth > width - marginLeft - marginRight && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine) {
          lines.push(currentLine);
        }
        
        // Draw each line
        for (const line of lines) {
          if (line.trim()) {
            currentPage.drawText(line, {
              x: marginLeft,
              y,
              size: defaultFontSize,
              font: regularFont,
              color: rgb(0, 0, 0)
            });
          }
          
          y -= defaultLineHeight;
          
          // Check if we need a new page
          if (y < marginBottom) {
            currentPage = pdfDoc.addPage();
            y = currentPage.getSize().height - marginTop;
          }
        }
        
        y -= 8; // Add extra spacing after paragraphs
        break;
        
      case 'listItem':
        // Draw bullet
        currentPage.drawText('•', {
          x: marginLeft,
          y,
          size: defaultFontSize,
          font: regularFont,
          color: rgb(0, 0, 0)
        });
        
        // Draw text (indented)
        currentPage.drawText(element.text, {
          x: marginLeft + 15, // Indent for bullet
          y,
          size: defaultFontSize,
          font: regularFont,
          color: rgb(0, 0, 0)
        });
        
        y -= defaultLineHeight;
        break;
        
      case 'table':
        if (!element.rows || element.rows.length === 0) break;
        
        const rows = element.rows;
        const cols = Math.max(...rows.map((row: string[]) => row.length));
        
        if (cols === 0) break;
        
        // Calculate table dimensions
        const tableWidth = width - marginLeft - marginRight;
        const colWidth = tableWidth / cols;
        const rowHeight = defaultLineHeight * 1.5;
        
        // Check if table fits on current page
        const tableHeight = rows.length * rowHeight;
        
        if (y - tableHeight < marginBottom) {
          currentPage = pdfDoc.addPage();
          y = currentPage.getSize().height - marginTop;
        }
        
        // Draw table
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const isHeader = i === 0; // Assume first row is header
          
          // Draw cells
          for (let j = 0; j < row.length; j++) {
            const cell = row[j];
            const xPos = marginLeft + (j * colWidth);
            
            if (preserveFormatting) {
              // Draw cell border
              currentPage.drawRectangle({
                x: xPos,
                y: y - rowHeight,
                width: colWidth,
                height: rowHeight,
                borderColor: rgb(0, 0, 0),
                borderWidth: 0.5,
                color: rgb(1, 1, 1) // White fill
              });
            }
            
            // Draw cell content
            currentPage.drawText(cell, {
              x: xPos + 5, // Add padding
              y: y - (rowHeight / 2) + (defaultFontSize / 2) - 2, // Center vertically
              size: defaultFontSize,
              font: isHeader ? boldFont : regularFont,
              color: rgb(0, 0, 0)
            });
          }
          
          y -= rowHeight;
          
          // Check if we need a new page
          if (i < rows.length - 1 && y < marginBottom) {
            currentPage = pdfDoc.addPage();
            y = currentPage.getSize().height - marginTop;
          }
        }
        
        y -= 10; // Add extra spacing after table
        break;
    }
  }
  
  return pdfDoc.getPageCount();
}

export default {
  convertDocxToPdf
};