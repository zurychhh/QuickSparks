/**
 * PDF to DOCX converter using pdf-lib
 * 
 * This module uses pdf-lib for handling PDF files and docx package to generate DOCX files.
 * 
 * Note: pdf-lib doesn't have built-in text extraction capabilities, so we use a simple approach
 * to extract what information we can and create a basic DOCX structure.
 */

const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { Document, Paragraph, TextRun, HeadingLevel, Packer } = require('docx');

/**
 * Convert PDF to DOCX using pdf-lib
 * @param {string} inputFilePath - Path to the input PDF file
 * @returns {Object} Result object with fileName and conversionTime
 */
async function pdfToDocx(inputFilePath) {
  const startTime = Date.now();
  
  try {
    // Read the PDF file
    const pdfBytes = fs.readFileSync(inputFilePath);
    
    // Load with pdf-lib to get document structure
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const pageCount = pages.length;
    
    // Since pdf-lib doesn't have text extraction capabilities,
    // we'll extract what information we can and create a basic DOCX structure
    
    // Create document sections
    const docContent = [];
    
    // Add document title (using the filename)
    const title = path.basename(inputFilePath, '.pdf');
    docContent.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      })
    );
    
    // Process each page
    for (let i = 0; i < pageCount; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      // Add page number as a heading
      if (pageCount > 1) {
        docContent.push(
          new Paragraph({
            text: `Page ${i + 1}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            pageBreakBefore: i > 0
          })
        );
      }
      
      // Add a note about limitations
      docContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Note: This conversion was performed using pdf-lib, which has limited text extraction capabilities. ",
              italics: true
            }),
            new TextRun({
              text: "For better results, consider using pdf2json or pdfjs converters.",
              italics: true
            })
          ],
          spacing: { after: 200 }
        })
      );
      
      // Add placeholder for page dimensions
      docContent.push(
        new Paragraph({
          text: `Page dimensions: ${width.toFixed(0)} x ${height.toFixed(0)} points`,
          spacing: { after: 100 }
        })
      );
      
      // Add sample text paragraphs as placeholders
      // In a real implementation, we would use better text extraction methods
      docContent.push(
        new Paragraph({
          text: "The document content would appear here if text extraction was available.",
          spacing: { after: 100 }
        })
      );
      
      // Add placeholder for potential document structure
      docContent.push(
        new Paragraph({
          text: "Sample heading that might appear in the document",
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 }
        })
      );
      
      // Add sample bullet points as placeholders
      docContent.push(
        new Paragraph({
          text: "Sample bullet point 1",
          bullet: { level: 0 }
        })
      );
      
      docContent.push(
        new Paragraph({
          text: "Sample bullet point 2",
          bullet: { level: 0 }
        })
      );
      
      docContent.push(
        new Paragraph({
          text: "Sample bullet point 3",
          bullet: { level: 0 },
          spacing: { after: 100 }
        })
      );
    }
    
    // Create the DOCX document
    const doc = new Document({
      title: title,
      sections: [{
        properties: {},
        children: docContent
      }]
    });
    
    // Generate output file name
    const outputFileName = `pdf-lib-${path.basename(inputFilePath, '.pdf')}-${Date.now()}.docx`;
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
    console.error('Error in pdf-lib conversion:', error);
    throw new Error(`PDF-lib conversion failed: ${error.message}`);
  }
}

module.exports = {
  pdfToDocx
};