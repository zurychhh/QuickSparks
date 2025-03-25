const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } = require('docx');
const { execSync } = require('child_process');

// Base directory
const FIXTURES_DIR = __dirname;

/**
 * Generate a simple PDF file
 */
async function generateSimplePdf(outputPath) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  page.drawText('Simple Test Document', {
    x: 50,
    y: 750,
    size: 24,
    font
  });
  
  page.drawText('This is a simple document to test PDF to DOCX conversion.', {
    x: 50,
    y: 700,
    size: 12,
    font
  });
  
  page.drawText('It contains basic text with minimal formatting.', {
    x: 50,
    y: 680,
    size: 12,
    font
  });
  
  page.drawText('The conversion service should be able to handle this file without any issues.', {
    x: 50,
    y: 660,
    size: 12,
    font
  });
  
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`Generated: ${outputPath}`);
}

/**
 * Generate a simple DOCX file
 */
async function generateSimpleDocx(outputPath) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: 'Simple Test Document',
          heading: HeadingLevel.HEADING_1
        }),
        new Paragraph({
          text: 'This is a simple document to test DOCX to PDF conversion.'
        }),
        new Paragraph({
          text: 'It contains basic text with minimal formatting.'
        }),
        new Paragraph({
          text: 'The conversion service should be able to handle this file without any issues.'
        })
      ]
    }]
  });
  
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated: ${outputPath}`);
}

/**
 * Convert HTML to PDF using wkhtmltopdf (if available)
 */
function convertHtmlToPdf(htmlPath, pdfPath) {
  try {
    // Check if wkhtmltopdf is installed
    execSync('which wkhtmltopdf', { stdio: 'ignore' });
    
    // Convert HTML to PDF
    execSync(`wkhtmltopdf "${htmlPath}" "${pdfPath}"`, { stdio: 'inherit' });
    console.log(`Generated: ${pdfPath}`);
    return true;
  } catch (error) {
    console.log(`Could not convert HTML to PDF using wkhtmltopdf. Falling back to simple PDF generation.`);
    return false;
  }
}

/**
 * Convert DocBook to DOCX using pandoc (if available)
 */
function convertDocbookToDocx(docbookPath, docxPath) {
  try {
    // Check if pandoc is installed
    execSync('which pandoc', { stdio: 'ignore' });
    
    // Convert DocBook to DOCX
    execSync(`pandoc -f docbook -t docx "${docbookPath}" -o "${docxPath}"`, { stdio: 'inherit' });
    console.log(`Generated: ${docxPath}`);
    return true;
  } catch (error) {
    console.log(`Could not convert DocBook to DOCX using pandoc. Falling back to simple DOCX generation.`);
    return false;
  }
}

/**
 * Generate all test files
 */
async function generateTestFiles() {
  // Create simple test files as fallbacks
  await generateSimplePdf(path.join(FIXTURES_DIR, 'simple.pdf'));
  await generateSimpleDocx(path.join(FIXTURES_DIR, 'simple.docx'));
  
  // Copy simple.pdf to other PDF test files if conversion tools aren't available
  fs.copyFileSync(
    path.join(FIXTURES_DIR, 'simple.pdf'),
    path.join(FIXTURES_DIR, 'text_heavy.pdf')
  );
  fs.copyFileSync(
    path.join(FIXTURES_DIR, 'simple.pdf'),
    path.join(FIXTURES_DIR, 'formatted.pdf')
  );
  fs.copyFileSync(
    path.join(FIXTURES_DIR, 'simple.pdf'),
    path.join(FIXTURES_DIR, 'with_images.pdf')
  );
  fs.copyFileSync(
    path.join(FIXTURES_DIR, 'simple.pdf'),
    path.join(FIXTURES_DIR, 'with_tables.pdf')
  );
  
  // Copy simple.docx to other DOCX test files if conversion tools aren't available
  fs.copyFileSync(
    path.join(FIXTURES_DIR, 'simple.docx'),
    path.join(FIXTURES_DIR, 'text_heavy.docx')
  );
  fs.copyFileSync(
    path.join(FIXTURES_DIR, 'simple.docx'),
    path.join(FIXTURES_DIR, 'formatted.docx')
  );
  fs.copyFileSync(
    path.join(FIXTURES_DIR, 'simple.docx'),
    path.join(FIXTURES_DIR, 'with_images.docx')
  );
  fs.copyFileSync(
    path.join(FIXTURES_DIR, 'simple.docx'),
    path.join(FIXTURES_DIR, 'with_tables.docx')
  );
  
  // Try to convert HTML to PDF if tools are available
  const htmlFiles = [
    'simple.html',
    'text_heavy.html',
    'formatted.html',
    'with_images.html',
    'with_tables.html'
  ];
  
  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(FIXTURES_DIR, htmlFile);
    const pdfPath = path.join(FIXTURES_DIR, htmlFile.replace('.html', '.pdf'));
    
    if (fs.existsSync(htmlPath)) {
      convertHtmlToPdf(htmlPath, pdfPath);
    }
  }
  
  // Try to convert DocBook to DOCX if tools are available
  const docbookFiles = [
    'simple.docbook',
    'text_heavy.docbook',
    'formatted.docbook',
    'with_images.docbook',
    'with_tables.docbook'
  ];
  
  for (const docbookFile of docbookFiles) {
    const docbookPath = path.join(FIXTURES_DIR, docbookFile);
    const docxPath = path.join(FIXTURES_DIR, docbookFile.replace('.docbook', '.docx'));
    
    if (fs.existsSync(docbookPath)) {
      convertDocbookToDocx(docbookPath, docxPath);
    }
  }
  
  console.log('Test files generation complete!');
}

// Run the file generator
generateTestFiles().catch(error => {
  console.error('Error generating test files:', error);
});