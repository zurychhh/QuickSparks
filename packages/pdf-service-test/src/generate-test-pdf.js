/**
 * Generate test PDF document using pdf-lib
 */

const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function generateTestPdf() {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Embed fonts
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  
  // Add a page
  const page = pdfDoc.addPage([600, 800]);
  const { width, height } = page.getSize();
  
  // Load test content
  const content = fs.readFileSync(
    path.join(__dirname, '../test-docs/test-content.txt'),
    'utf-8'
  );
  
  // Parse content
  const lines = content.split('\n');
  
  // Draw content
  let y = height - 50;
  const lineHeight = 20;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle heading (first line)
    if (i === 0) {
      page.drawText(line, {
        x: 50,
        y,
        size: 24,
        font: bold,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight * 2;
    }
    // Handle bullet points
    else if (line.startsWith('-')) {
      page.drawText('•' + line.substring(1), {
        x: 70,
        y,
        size: 12,
        font: regular,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
    }
    // Handle empty lines
    else if (line.trim() === '') {
      y -= lineHeight;
    }
    // Regular text
    else {
      page.drawText(line, {
        x: 50,
        y,
        size: 12,
        font: regular,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
    }
  }
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  
  // Ensure the test-files directory exists
  const outputDir = path.join(__dirname, '../test-files');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write to file
  const outputPath = path.join(outputDir, 'test-document.pdf');
  fs.writeFileSync(outputPath, pdfBytes);
  
  console.log(`Test PDF generated at: ${outputPath}`);
  return outputPath;
}

// Generate the PDF if run directly
if (require.main === module) {
  generateTestPdf()
    .then(() => console.log('Done!'))
    .catch(err => console.error('Error generating test PDF:', err));
}

module.exports = generateTestPdf;