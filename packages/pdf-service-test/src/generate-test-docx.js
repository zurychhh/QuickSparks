/**
 * Generate test DOCX document using docx
 */

const fs = require('fs');
const path = require('path');
const { 
  Document, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  Table, 
  TableRow, 
  TableCell, 
  BorderStyle, 
  Packer,
  SectionType
} = require('docx');

async function generateTestDocx() {
  try {
    // Create title paragraph
    const title = new Paragraph({
      text: "Test DOCX Document",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 }
    });

    // Create introduction paragraph
    const intro = new Paragraph({
      children: [
        new TextRun("This is a test DOCX document for evaluating "),
        new TextRun({ text: "DOCX to PDF", bold: true }),
        new TextRun(" conversion capabilities of different libraries.")
      ],
      spacing: { after: 200 }
    });

    // Add section heading
    const sectionHeading = new Paragraph({
      text: "Document Features",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 }
    });

    // Add bullet points
    const bulletPoint1 = new Paragraph({
      text: "Text formatting including bold, italic, and underline",
      bullet: { level: 0 }
    });

    const bulletPoint2 = new Paragraph({
      text: "Headings and document structure",
      bullet: { level: 0 }
    });

    const bulletPoint3 = new Paragraph({
      text: "Tables with borders and formatting",
      bullet: { level: 0 },
      spacing: { after: 200 }
    });

    // Add text with different formatting
    const formattingHeading = new Paragraph({
      text: "Text Formatting Examples",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 }
    });

    const formattingExample = new Paragraph({
      children: [
        new TextRun({ text: "Normal text, " }),
        new TextRun({ text: "bold text, ", bold: true }),
        new TextRun({ text: "italic text, ", italics: true }),
        new TextRun({ text: "bold italic text, ", bold: true, italics: true }),
        new TextRun({ text: "underlined text.", underline: true })
      ],
      spacing: { after: 200 }
    });

    // Add table
    const tableHeading = new Paragraph({
      text: "Table Example",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 }
    });

    const table = new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "Header 1", alignment: AlignmentType.CENTER })],
              width: { size: 33, type: '%' }
            }),
            new TableCell({
              children: [new Paragraph({ text: "Header 2", alignment: AlignmentType.CENTER })],
              width: { size: 33, type: '%' }
            }),
            new TableCell({
              children: [new Paragraph({ text: "Header 3", alignment: AlignmentType.CENTER })],
              width: { size: 34, type: '%' }
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph("Row 1, Cell 1")],
              width: { size: 33, type: '%' }
            }),
            new TableCell({
              children: [new Paragraph("Row 1, Cell 2")],
              width: { size: 33, type: '%' }
            }),
            new TableCell({
              children: [new Paragraph("Row 1, Cell 3")],
              width: { size: 34, type: '%' }
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph("Row 2, Cell 1")],
              width: { size: 33, type: '%' }
            }),
            new TableCell({
              children: [new Paragraph("Row 2, Cell 2")],
              width: { size: 33, type: '%' }
            }),
            new TableCell({
              children: [new Paragraph("Row 2, Cell 3")],
              width: { size: 34, type: '%' }
            })
          ]
        })
      ],
      width: { size: 100, type: '%' },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
      }
    });

    // Add conclusion
    const conclusion = new Paragraph({
      text: "This document will be used to test the quality of DOCX to PDF conversion.",
      spacing: { before: 200 }
    });

    // Create a new DOCX document with sections
    const doc = new Document({
      title: "Test Document",
      description: "A test document for PDF conversion",
      styles: {
        paragraphStyles: [
          {
            id: "Normal",
            name: "Normal",
            run: {
              size: 24, // 12pt
              font: "Calibri",
            }
          }
        ]
      },
      sections: [{
        properties: {
          type: SectionType.CONTINUOUS
        },
        children: [
          title,
          intro,
          sectionHeading,
          bulletPoint1,
          bulletPoint2,
          bulletPoint3,
          formattingHeading,
          formattingExample,
          tableHeading,
          table,
          conclusion
        ]
      }]
    });

    // Ensure the test-files directory exists
    const outputDir = path.join(__dirname, '../test-files');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write to file
    const outputPath = path.join(outputDir, 'test-document.docx');
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);

    console.log(`Test DOCX generated at: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error generating test DOCX:', error);
    throw error;
  }
}

// Generate the DOCX if run directly
if (require.main === module) {
  generateTestDocx()
    .then(() => console.log('Done!'))
    .catch(err => console.error('Error generating test DOCX:', err));
}

module.exports = generateTestDocx;