/**
 * DOCX to PDF converter using mammoth and pdf-lib
 * 
 * This module uses mammoth to extract text, styles, and structure from DOCX files
 * and then pdf-lib to generate PDF files with improved formatting.
 */

const mammoth = require('mammoth');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

/**
 * Parse HTML content and convert it to structured document elements
 * @param {string} html - HTML content from mammoth
 * @returns {Array} Array of document elements with type, text, and style properties
 */
function parseHtml(html) {
  const elements = [];
  
  // Basic parsing of HTML tags
  // This is a simplified approach - a real implementation would use a proper HTML parser
  let currentIndex = 0;
  
  // Define patterns for different HTML elements
  const patterns = [
    { 
      regex: /<h1[^>]*>(.*?)<\/h1>/gi, 
      type: 'heading1'
    },
    { 
      regex: /<h2[^>]*>(.*?)<\/h2>/gi, 
      type: 'heading2'
    },
    { 
      regex: /<p[^>]*>(.*?)<\/p>/gi, 
      type: 'paragraph'
    },
    { 
      regex: /<li[^>]*>(.*?)<\/li>/gi, 
      type: 'listItem'
    },
    { 
      regex: /<table[^>]*>(.*?)<\/table>/gis, 
      type: 'table',
      processContent: true
    },
    { 
      regex: /<strong[^>]*>(.*?)<\/strong>/gi, 
      type: 'bold',
      inline: true 
    },
    { 
      regex: /<em[^>]*>(.*?)<\/em>/gi, 
      type: 'italic',
      inline: true
    },
    { 
      regex: /<u[^>]*>(.*?)<\/u>/gi, 
      type: 'underline',
      inline: true
    }
  ];
  
  // First pass - extract blocks (headings, paragraphs, etc.)
  let remainingHtml = html;
  let match;
  
  // Process block-level elements first
  const blockPatterns = patterns.filter(p => !p.inline);
  
  for (const pattern of blockPatterns) {
    const regex = new RegExp(pattern.regex);
    let lastIndex = 0;
    
    while ((match = regex.exec(remainingHtml)) !== null) {
      const content = match[1].trim();
      
      if (pattern.type === 'table') {
        // Process table content to extract rows and cells
        const tableElement = {
          type: 'table',
          rows: []
        };
        
        // Extract rows
        const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
        let rowMatch;
        const tableContent = match[1];
        
        while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
          const row = [];
          
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
        // Process inline formatting in content
        let processedContent = content;
        
        // Replace <strong>, <em>, <u> tags with markers for later processing
        processedContent = processedContent.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
        processedContent = processedContent.replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_');
        processedContent = processedContent.replace(/<u[^>]*>(.*?)<\/u>/gi, '__$1__');
        
        // Remove any other HTML tags
        processedContent = processedContent.replace(/<[^>]*>/g, '');
        
        elements.push({
          type: pattern.type,
          text: processedContent,
          inlineFormatting: true
        });
      }
    }
  }
  
  return elements;
}

/**
 * Render document elements to PDF
 * @param {Object} pdfDoc - PDFDocument instance
 * @param {Array} elements - Document elements
 * @returns {Object} PDFDocument with rendered content
 */
async function renderElements(pdfDoc, elements) {
  // Fonts for different styles
  const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const boldItalicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
  
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
        // Process text with inline formatting
        const text = element.text;
        const lines = [];
        
        // Simple text wrapping
        let currentLine = '';
        const words = text.split(' ');
        
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
          // Check for inline formatting
          if (element.inlineFormatting) {
            // This is a very simplified approach to inline formatting
            // A real implementation would use a more sophisticated text rendering approach
            let xOffset = marginLeft;
            
            // Split by formatting markers
            const segments = line.split(/(\*\*.*?\*\*|_.*?_|__.*?__)/g);
            
            for (const segment of segments) {
              let font = regularFont;
              let text = segment;
              
              // Bold
              if (segment.startsWith('**') && segment.endsWith('**')) {
                font = boldFont;
                text = segment.substring(2, segment.length - 2);
              } 
              // Italic
              else if (segment.startsWith('_') && segment.endsWith('_')) {
                font = italicFont;
                text = segment.substring(1, segment.length - 1);
              }
              // Underline - pdf-lib doesn't directly support underline, so we'll just use bold for this demo
              else if (segment.startsWith('__') && segment.endsWith('__')) {
                font = boldFont;
                text = segment.substring(2, segment.length - 2);
              }
              
              if (text) {
                currentPage.drawText(text, {
                  x: xOffset,
                  y,
                  size: defaultFontSize,
                  font,
                  color: rgb(0, 0, 0)
                });
                
                xOffset += font.widthOfTextAtSize(text, defaultFontSize);
              }
            }
          } else {
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
        const cols = Math.max(...rows.map(row => row.length));
        
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
  
  return pdfDoc;
}

/**
 * Convert DOCX to PDF using mammoth and pdf-lib with improved formatting
 * @param {string} inputFilePath - Path to the input DOCX file
 * @returns {Object} Result object with fileName and conversionTime
 */
async function docxToPdf(inputFilePath) {
  const startTime = Date.now();
  
  try {
    // Extract HTML content from DOCX
    const result = await mammoth.convertToHtml({ path: inputFilePath });
    const html = result.value;
    
    // Also extract raw text for fallback
    const textResult = await mammoth.extractRawText({ path: inputFilePath });
    const rawText = textResult.value;
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Parse HTML into structured elements
    const elements = parseHtml(html);
    
    if (elements.length === 0) {
      // Fallback to basic text rendering if parsing fails
      const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const fontSize = 12;
      const lineHeight = fontSize * 1.2;
      const marginLeft = 50;
      const marginTop = 50;
      
      const page = pdfDoc.addPage();
      const { height } = page.getSize();
      
      // Split text into lines
      const lines = rawText.split('\n');
      
      // Draw each line of text
      let y = height - marginTop;
      let currentPage = page;
      
      for (const line of lines) {
        if (y < marginTop) {
          // Add a new page if we run out of space
          currentPage = pdfDoc.addPage();
          y = currentPage.getSize().height - marginTop;
        }
        
        currentPage.drawText(line, {
          x: marginLeft,
          y,
          size: fontSize,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        y -= lineHeight;
      }
    } else {
      // Render structured elements to PDF
      await renderElements(pdfDoc, elements);
    }
    
    // Generate output file name
    const outputFileName = `mammoth-${path.basename(inputFilePath, '.docx')}-${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, '../../outputs', outputFileName);
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);
    
    const endTime = Date.now();
    
    return {
      fileName: outputFileName,
      conversionTime: endTime - startTime
    };
    
  } catch (error) {
    console.error('Error in mammoth conversion:', error);
    throw new Error(`Mammoth conversion failed: ${error.message}`);
  }
}

module.exports = {
  docxToPdf
};