/**
 * PDF to DOCX converter using pdfjs-dist
 * 
 * This module uses pdfjs-dist to extract text and layout information from PDF files
 * and convert them to DOCX format using docx package.
 * 
 * PDF.js provides robust text extraction capabilities and supports font styling detection,
 * making it good for preserving text formatting during conversion.
 */

const pdfjsLib = require('pdfjs-dist');
const fs = require('fs');
const path = require('path');
const { 
  Document, 
  Paragraph, 
  TextRun, 
  Packer, 
  AlignmentType, 
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle
} = require('docx');

/**
 * Convert PDF to DOCX using pdfjs-dist
 * @param {string} inputFilePath - Path to the input PDF file
 * @returns {Object} Result object with fileName and conversionTime
 */
async function pdfToDocx(inputFilePath) {
  const startTime = Date.now();
  
  try {
    // Load the PDF file
    const data = new Uint8Array(fs.readFileSync(inputFilePath));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    
    // Get document metadata
    const metadata = await pdfDocument.getMetadata();
    const title = metadata.info?.Title || path.basename(inputFilePath, '.pdf');
    const pageCount = pdfDocument.numPages;
    
    // Document content array
    const docContent = [];
    
    // Add document title
    docContent.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      })
    );
    
    // Flag to track if we've seen a title in the actual content
    let titleSeen = true;
    
    // Process each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      
      // Add page marker (can be commented out in final version)
      if (pageCount > 1) {
        docContent.push(
          new Paragraph({
            text: `Page ${pageNum}`,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 300, after: 100 },
            pageBreakBefore: pageNum > 1
          })
        );
      }
      
      // Get page dimensions for analysis
      const viewport = page.getViewport({ scale: 1.0 });
      const pageWidth = viewport.width;
      const pageHeight = viewport.height;
      
      // Extract text content
      const textContent = await page.getTextContent();
      
      // Check for potential table structures (simple detection)
      const tableStructures = detectTables(textContent, pageWidth, pageHeight);
      
      // Handle tables if detected
      if (tableStructures.length > 0) {
        for (const tableStructure of tableStructures) {
          const table = createDocxTable(tableStructure);
          docContent.push(table);
          docContent.push(new Paragraph({ spacing: { after: 200 } }));
        }
      }
      
      // Group text items by their y position to identify lines
      const textByLine = {};
      
      for (const item of textContent.items) {
        // Round to fix floating point issues
        const yPos = Math.round(item.transform[5] * 10) / 10;
        
        if (!textByLine[yPos]) {
          textByLine[yPos] = [];
        }
        
        // Extract font information
        const fontSize = item.height || 12;
        const fontFamily = item.fontName || 'default';
        // Simple heuristic to guess if text might be bold or italic
        const isBold = fontFamily.toLowerCase().includes('bold');
        const isItalic = fontFamily.toLowerCase().includes('italic') || fontFamily.toLowerCase().includes('oblique');
        
        textByLine[yPos].push({
          text: item.str,
          x: item.transform[4],
          width: item.width,
          height: item.height,
          fontSize,
          isBold,
          isItalic
        });
      }
      
      // Sort lines by y position (in reverse order since PDF y coords go from bottom to top)
      const sortedYPositions = Object.keys(textByLine).sort((a, b) => parseFloat(b) - parseFloat(a));
      
      // Process each line
      for (const yPos of sortedYPositions) {
        // Sort text fragments within the line by x position
        const sortedTextFragments = textByLine[yPos].sort((a, b) => a.x - b.x);
        
        // Skip empty lines
        if (sortedTextFragments.every(fragment => fragment.text.trim() === '')) {
          continue;
        }
        
        // Reconstruct line text
        const lineText = sortedTextFragments.map(fragment => fragment.text).join(' ');
        
        // Skip if this appears to be a duplicate title
        if (titleSeen && sortedTextFragments.length === 1 && 
            sortedTextFragments[0].fontSize > 14 && 
            lineText.toLowerCase() === title.toLowerCase()) {
          continue;
        }
        
        // Determine if line is a heading
        const isHeading = sortedTextFragments.some(fragment => fragment.fontSize > 12) || 
                         sortedTextFragments.every(fragment => fragment.isBold);
        
        // Determine if line is a list item
        const isList = lineText.trim().startsWith('-') || 
                      lineText.trim().startsWith('•') || 
                      lineText.trim().startsWith('*');
                      
        // Determine indentation level
        const isIndented = sortedTextFragments.length > 0 && sortedTextFragments[0].x > 20;
        
        if (isHeading && !titleSeen) {
          // This might be a document title
          titleSeen = true;
          docContent.push(
            new Paragraph({
              text: lineText,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 }
            })
          );
        } else if (isHeading) {
          // This is a regular heading
          docContent.push(
            new Paragraph({
              text: lineText,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 }
            })
          );
        } else if (isList) {
          // This is a list item
          const textContent = lineText.replace(/^[-•*]\s*/, '');
          docContent.push(
            new Paragraph({
              text: textContent,
              bullet: { level: 0 },
              indent: isIndented ? { left: 400 } : undefined
            })
          );
        } else {
          // Create paragraph with text runs for styling
          const children = sortedTextFragments.map(fragment => 
            new TextRun({
              text: fragment.text,
              bold: fragment.isBold,
              italics: fragment.isItalic,
              size: fragment.fontSize * 2 // Convert to DOCX size
            })
          );
          
          docContent.push(
            new Paragraph({
              children,
              spacing: { after: 100 },
              indent: isIndented ? { left: 400 } : undefined
            })
          );
        }
      }
    }
    
    // Create a DOCX document
    const doc = new Document({
      title: title,
      sections: [{
        properties: {},
        children: docContent
      }]
    });
    
    // Generate output file name
    const outputFileName = `pdfjs-${path.basename(inputFilePath, '.pdf')}-${Date.now()}.docx`;
    const outputPath = path.join(__dirname, '../../outputs', outputFileName);
    
    // Save the document
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    
    const endTime = Date.now();
    
    return {
      fileName: outputFileName,
      conversionTime: endTime - startTime,
      pageCount,
      title
    };
    
  } catch (error) {
    console.error('Error in pdfjs conversion:', error);
    throw new Error(`PDFJS conversion failed: ${error.message}`);
  }
}

/**
 * Simple table detection logic
 * @param {Object} textContent - PDF.js text content
 * @param {number} pageWidth - Page width
 * @param {number} pageHeight - Page height
 * @returns {Array} Detected table structures
 */
function detectTables(textContent, pageWidth, pageHeight) {
  // This is a simplistic implementation
  // In a production system, we would use more sophisticated algorithms
  // to detect table structures based on text alignment, spacing patterns, etc.
  
  // For this example, we'll just look for evenly spaced items in a grid pattern
  const tables = [];
  
  // Detect potential table rows (simplified)
  const yPositions = new Set();
  const xPositions = new Set();
  
  // Collect all x and y positions
  for (const item of textContent.items) {
    yPositions.add(Math.round(item.transform[5]));
    xPositions.add(Math.round(item.transform[4]));
  }
  
  // If we have multiple items aligned on both axes, it might be a table
  if (yPositions.size >= 3 && xPositions.size >= 2) {
    // This is a very simplified detection - in reality this would be more complex
    const potentialTable = {
      rows: []
    };
    
    // Get sorted positions
    const sortedY = Array.from(yPositions).sort((a, b) => b - a); // Reverse order for PDF coordinates
    const sortedX = Array.from(xPositions).sort((a, b) => a - b);
    
    // Create table cells
    for (const y of sortedY) {
      const row = [];
      
      for (const x of sortedX) {
        // Find text items at this position
        const cellItems = textContent.items.filter(item => 
          Math.abs(item.transform[5] - y) < 5 &&
          Math.abs(item.transform[4] - x) < 20
        );
        
        // Create cell text
        const cellText = cellItems.map(item => item.str).join(' ');
        row.push(cellText);
      }
      
      // Only add row if it has some non-empty cells
      if (row.some(cell => cell.trim() !== '')) {
        potentialTable.rows.push(row);
      }
    }
    
    // Add table if it has content
    if (potentialTable.rows.length > 1) {
      tables.push(potentialTable);
    }
  }
  
  return tables;
}

/**
 * Create a DOCX table from a detected table structure
 * @param {Object} tableStructure - Detected table structure
 * @returns {Table} DOCX table
 */
function createDocxTable(tableStructure) {
  const rows = tableStructure.rows.map(rowData => {
    return new TableRow({
      children: rowData.map(cellText => {
        return new TableCell({
          children: [new Paragraph(cellText || ' ')],
          width: { size: 100 / rowData.length, type: '%' }
        });
      })
    });
  });
  
  return new Table({
    rows,
    width: { size: 100, type: '%' },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
    }
  });
}

module.exports = {
  pdfToDocx
};