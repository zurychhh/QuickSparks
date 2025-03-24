/**
 * Create sample PDF and DOCX files for testing
 * 
 * This script generates test files that can be used to evaluate 
 * PDF conversion libraries.
 */

const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { Document, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, AlignmentType, Packer } = require('docx');

const TEST_FILES_DIR = path.join(__dirname, '../test-files');

// Ensure test files directory exists
if (!fs.existsSync(TEST_FILES_DIR)) {
  fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
}

/**
 * Create a sample PDF with various formatting
 */
async function createSamplePdf() {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  
  // Create first page
  const page1 = pdfDoc.addPage();
  const { width, height } = page1.getSize();
  
  // Add title
  page1.drawText('Sample PDF Document for Testing', {
    x: 50,
    y: height - 50,
    size: 24,
    font: timesBoldFont,
    color: rgb(0, 0, 0),
  });
  
  // Add paragraph
  const paragraph1 = 'This is a sample PDF document created for testing PDF conversion libraries. ' +
    'It contains various formatting elements including headings, paragraphs, bold and italic text, ' +
    'and multiple pages.';
  
  page1.drawText(paragraph1, {
    x: 50,
    y: height - 100,
    size: 12,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
    maxWidth: width - 100,
    lineHeight: 16,
  });
  
  // Add section heading
  page1.drawText('Section 1: Text Formatting', {
    x: 50,
    y: height - 170,
    size: 18,
    font: timesBoldFont,
    color: rgb(0, 0, 0),
  });
  
  // Add formatted text examples
  page1.drawText('Regular text', {
    x: 50,
    y: height - 200,
    size: 12,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  page1.drawText('Bold text example', {
    x: 50,
    y: height - 220,
    size: 12,
    font: timesBoldFont,
    color: rgb(0, 0, 0),
  });
  
  page1.drawText('Italic text example', {
    x: 50,
    y: height - 240,
    size: 12,
    font: timesItalicFont,
    color: rgb(0, 0, 0),
  });
  
  // Create second page
  const page2 = pdfDoc.addPage();
  
  // Add section heading
  page2.drawText('Section 2: Lists and Tables', {
    x: 50,
    y: height - 50,
    size: 18,
    font: timesBoldFont,
    color: rgb(0, 0, 0),
  });
  
  // Add bullet points
  page2.drawText('• Item 1: First bullet point', {
    x: 50,
    y: height - 80,
    size: 12,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  page2.drawText('• Item 2: Second bullet point', {
    x: 50,
    y: height - 100,
    size: 12,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  page2.drawText('• Item 3: Third bullet point', {
    x: 50,
    y: height - 120,
    size: 12,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  // Draw a simple table (just lines and text to simulate a table)
  // Table header
  page2.drawLine({
    start: { x: 50, y: height - 150 },
    end: { x: width - 50, y: height - 150 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  page2.drawText('Column 1', { x: 70, y: height - 170, size: 12, font: timesBoldFont });
  page2.drawText('Column 2', { x: 220, y: height - 170, size: 12, font: timesBoldFont });
  page2.drawText('Column 3', { x: 370, y: height - 170, size: 12, font: timesBoldFont });
  
  // Table divider
  page2.drawLine({
    start: { x: 50, y: height - 180 },
    end: { x: width - 50, y: height - 180 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  // Table rows
  page2.drawText('Row 1, Cell 1', { x: 70, y: height - 200, size: 12, font: timesRomanFont });
  page2.drawText('Row 1, Cell 2', { x: 220, y: height - 200, size: 12, font: timesRomanFont });
  page2.drawText('Row 1, Cell 3', { x: 370, y: height - 200, size: 12, font: timesRomanFont });
  
  page2.drawLine({
    start: { x: 50, y: height - 210 },
    end: { x: width - 50, y: height - 210 },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  
  page2.drawText('Row 2, Cell 1', { x: 70, y: height - 230, size: 12, font: timesRomanFont });
  page2.drawText('Row 2, Cell 2', { x: 220, y: height - 230, size: 12, font: timesRomanFont });
  page2.drawText('Row 2, Cell 3', { x: 370, y: height - 230, size: 12, font: timesRomanFont });
  
  page2.drawLine({
    start: { x: 50, y: height - 240 },
    end: { x: width - 50, y: height - 240 },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  
  page2.drawText('Row 3, Cell 1', { x: 70, y: height - 260, size: 12, font: timesRomanFont });
  page2.drawText('Row 3, Cell 2', { x: 220, y: height - 260, size: 12, font: timesRomanFont });
  page2.drawText('Row 3, Cell 3', { x: 370, y: height - 260, size: 12, font: timesRomanFont });
  
  // Bottom line
  page2.drawLine({
    start: { x: 50, y: height - 270 },
    end: { x: width - 50, y: height - 270 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  // Vertical lines
  page2.drawLine({
    start: { x: 50, y: height - 150 },
    end: { x: 50, y: height - 270 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  page2.drawLine({
    start: { x: 180, y: height - 150 },
    end: { x: 180, y: height - 270 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  page2.drawLine({
    start: { x: 330, y: height - 150 },
    end: { x: 330, y: height - 270 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  page2.drawLine({
    start: { x: width - 50, y: height - 150 },
    end: { x: width - 50, y: height - 270 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(TEST_FILES_DIR, 'sample-document.pdf');
  fs.writeFileSync(outputPath, pdfBytes);
  
  console.log(`Sample PDF created at: ${outputPath}`);
  return outputPath;
}

/**
 * Create a sample DOCX document with various formatting
 */
async function createSampleDocx() {
  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          text: 'Sample DOCX Document for Testing',
          heading: 'Heading1',
          spacing: { after: 200 }
        }),
        
        // Introduction paragraph
        new Paragraph({
          children: [
            new TextRun('This is a sample DOCX document created for testing DOCX to PDF conversion libraries. '),
            new TextRun('It contains various formatting elements including headings, paragraphs, bold and italic text, tables and more.')
          ],
          spacing: { after: 200 }
        }),
        
        // Section heading
        new Paragraph({
          text: 'Section 1: Text Formatting',
          heading: 'Heading2',
          spacing: { before: 200, after: 100 }
        }),
        
        // Text with different formatting
        new Paragraph({ text: 'Regular text' }),
        
        new Paragraph({
          children: [new TextRun({ text: 'Bold text example', bold: true })],
          spacing: { before: 100 }
        }),
        
        new Paragraph({
          children: [new TextRun({ text: 'Italic text example', italics: true })],
          spacing: { before: 100, after: 200 }
        }),
        
        // Section heading
        new Paragraph({
          text: 'Section 2: Lists and Tables',
          heading: 'Heading2',
          spacing: { before: 200, after: 100 }
        }),
        
        // Bulleted list
        new Paragraph({
          text: 'Item 1: First bullet point',
          bullet: { level: 0 }
        }),
        
        new Paragraph({
          text: 'Item 2: Second bullet point',
          bullet: { level: 0 }
        }),
        
        new Paragraph({
          text: 'Item 3: Third bullet point',
          bullet: { level: 0 },
          spacing: { after: 200 }
        }),
        
        // Table
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: 'Column 1', alignment: AlignmentType.CENTER })],
                  width: { size: 33.33, type: 'pct' }
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Column 2', alignment: AlignmentType.CENTER })],
                  width: { size: 33.33, type: 'pct' }
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Column 3', alignment: AlignmentType.CENTER })],
                  width: { size: 33.33, type: 'pct' }
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('Row 1, Cell 1')],
                  width: { size: 33.33, type: 'pct' }
                }),
                new TableCell({
                  children: [new Paragraph('Row 1, Cell 2')],
                  width: { size: 33.33, type: 'pct' }
                }),
                new TableCell({
                  children: [new Paragraph('Row 1, Cell 3')],
                  width: { size: 33.33, type: 'pct' }
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('Row 2, Cell 1')],
                  width: { size: 33.33, type: 'pct' }
                }),
                new TableCell({
                  children: [new Paragraph('Row 2, Cell 2')],
                  width: { size: 33.33, type: 'pct' }
                }),
                new TableCell({
                  children: [new Paragraph('Row 2, Cell 3')],
                  width: { size: 33.33, type: 'pct' }
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('Row 3, Cell 1')],
                  width: { size: 33.33, type: 'pct' }
                }),
                new TableCell({
                  children: [new Paragraph('Row 3, Cell 2')],
                  width: { size: 33.33, type: 'pct' }
                }),
                new TableCell({
                  children: [new Paragraph('Row 3, Cell 3')],
                  width: { size: 33.33, type: 'pct' }
                })
              ]
            })
          ],
          width: {
            size: 100,
            type: 'pct'
          },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
          }
        })
      ]
    }]
  });
  
  // Save the document
  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(TEST_FILES_DIR, 'sample-document.docx');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Sample DOCX created at: ${outputPath}`);
  return outputPath;
}

// Create both sample files when run directly
if (require.main === module) {
  (async () => {
    try {
      await createSamplePdf();
      await createSampleDocx();
      console.log('Sample files created successfully!');
    } catch (error) {
      console.error('Error creating sample files:', error);
    }
  })();
}

module.exports = {
  createSamplePdf,
  createSampleDocx
};