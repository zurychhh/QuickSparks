/**
 * PDF to DOCX converter using pdf2json
 * 
 * This module uses pdf2json to extract text and layout information from PDF files
 * and convert them to DOCX format using docx package.
 * 
 * pdf2json provides detailed layout information that helps in preserving
 * the structure and positioning of content in the output DOCX.
 */

const PDFParser = require('pdf2json');
const fs = require('fs');
const path = require('path');
const { 
  Document, 
  Paragraph, 
  TextRun, 
  Packer, 
  AlignmentType,
  HeadingLevel,
  ImageRun,
  Tab
} = require('docx');

/**
 * Convert PDF to DOCX using pdf2json
 * @param {string} inputFilePath - Path to the input PDF file
 * @returns {Object} Result object with fileName and conversionTime
 */
async function pdfToDocx(inputFilePath) {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    try {
      const pdfParser = new PDFParser();
      
      pdfParser.on("pdfParser_dataError", errData => {
        reject(new Error(errData.parserError));
      });
      
      pdfParser.on("pdfParser_dataReady", async pdfData => {
        try {
          // Process the PDF data
          const docContent = [];
          
          // Extract metadata
          const pageCount = pdfData.Pages.length;
          const title = pdfData.Meta?.Title || path.basename(inputFilePath, '.pdf');
          
          // Add title as a heading
          docContent.push(
            new Paragraph({
              text: title,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 }
            })
          );
          
          // Track if we already found a title to avoid duplicating it
          let titleFound = true;
          
          // Process each page
          for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
            const page = pdfData.Pages[pageIndex];
            
            // Process images if available
            if (page.Fills && page.Fills.length > 0) {
              // In a real implementation, we would extract and embed images
              // This is a placeholder as image extraction is complex
              docContent.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: "[Image placeholder - pdf2json detected an image here]", italics: true })
                  ],
                  spacing: { before: 100, after: 100 }
                })
              );
            }
            
            // Group texts by y position (lines)
            const textByLine = {};
            
            for (const text of page.Texts) {
              const yPos = Math.round(text.y * 10) / 10; // Round to fix floating point issues
              
              if (!textByLine[yPos]) {
                textByLine[yPos] = [];
              }
              
              // Decode the text and add to the line
              const decodedText = decodeURIComponent(text.R.map(r => r.T).join(' '));
              
              // Extract styles
              const fontStyles = text.R[0]?.S || {};
              const fontSize = fontStyles.fontSize || 12;
              const isBold = !!fontStyles.bold;
              const isItalic = !!fontStyles.italic;
              
              textByLine[yPos].push({
                text: decodedText,
                x: text.x,
                fontSize,
                isBold,
                isItalic
              });
            }
            
            // Sort lines by y position (top to bottom)
            const sortedYPositions = Object.keys(textByLine).sort((a, b) => parseFloat(a) - parseFloat(b));
            
            // Process each line
            for (const yPos of sortedYPositions) {
              // Sort text fragments within the line by x position (left to right)
              const sortedTextFragments = textByLine[yPos].sort((a, b) => a.x - b.x);
              
              // Skip if we already have a title and this looks like a duplicate title
              if (titleFound && sortedTextFragments.length === 1 && sortedTextFragments[0].fontSize > 14) {
                continue;
              }
              
              // Check if line might be a heading (larger font or bold)
              const isHeading = sortedTextFragments.some(fragment => 
                fragment.fontSize > 14 || fragment.isBold
              );
              
              // Check if line might be a list item
              const lineText = sortedTextFragments.map(f => f.text).join(' ');
              const isList = lineText.trim().startsWith('-') || 
                             lineText.trim().startsWith('•') || 
                             lineText.trim().startsWith('*');
              
              // Check indentation (might indicate a list or paragraph structure)
              const isIndented = sortedTextFragments.length > 0 && sortedTextFragments[0].x > 10;
              
              if (isHeading && !titleFound) {
                // This might be the document title
                titleFound = true;
                docContent.push(
                  new Paragraph({
                    text: lineText,
                    heading: HeadingLevel.HEADING_1,
                    spacing: { after: 200 }
                  })
                );
              } else if (isHeading) {
                // This might be a section heading
                docContent.push(
                  new Paragraph({
                    text: lineText,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 100 }
                  })
                );
              } else if (isList) {
                // This looks like a list item
                const textContent = lineText.replace(/^[-•*]\s*/, '');
                docContent.push(
                  new Paragraph({
                    text: textContent,
                    bullet: { level: 0 }
                  })
                );
              } else {
                // Regular paragraph with text runs for each fragment
                const children = sortedTextFragments.map(fragment => 
                  new TextRun({
                    text: fragment.text,
                    bold: fragment.isBold,
                    italics: fragment.isItalic,
                    size: fragment.fontSize * 2 // Convert to DOCX size (points)
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
            
            // Add page break if not the last page
            if (pageIndex < pageCount - 1) {
              docContent.push(new Paragraph({ text: '', pageBreakBefore: true }));
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
          const outputFileName = `pdf2json-${path.basename(inputFilePath, '.pdf')}-${Date.now()}.docx`;
          const outputPath = path.join(__dirname, '../../outputs', outputFileName);
          
          // Save the document
          const buffer = await Packer.toBuffer(doc);
          fs.writeFileSync(outputPath, buffer);
          
          const endTime = Date.now();
          
          resolve({
            fileName: outputFileName,
            conversionTime: endTime - startTime,
            pageCount,
            title
          });
          
        } catch (error) {
          reject(new Error(`Error processing PDF data: ${error.message}`));
        }
      });
      
      // Load the PDF file
      pdfParser.loadPDF(inputFilePath);
      
    } catch (error) {
      reject(new Error(`PDF2JSON conversion failed: ${error.message}`));
    }
  });
}

module.exports = {
  pdfToDocx
};