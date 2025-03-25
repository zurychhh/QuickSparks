# Test Fixtures for PDF ↔ DOCX Conversion Service

This directory contains test fixtures for testing the PDF to DOCX and DOCX to PDF conversion services.

## Test File Types

The test fixtures include the following file types:

### PDF Test Files
- `simple.pdf` - A simple PDF document with basic text
- `text_heavy.pdf` - A PDF document with extensive text content
- `formatted.pdf` - A PDF document with various formatting (headings, lists, etc.)
- `with_images.pdf` - A PDF document containing embedded images
- `with_tables.pdf` - A PDF document with tables of varying complexity

### DOCX Test Files
- `simple.docx` - A simple DOCX document with basic text
- `text_heavy.docx` - A DOCX document with extensive text content
- `formatted.docx` - A DOCX document with various formatting (headings, lists, etc.)
- `with_images.docx` - A DOCX document containing embedded images
- `with_tables.docx` - A DOCX document with tables of varying complexity

### Source Files
The repository also includes the source files used to generate these test documents:
- `.html` files - HTML sources for generating PDFs
- `.docbook` files - DocBook XML sources for generating DOCX files

## Generating Test Files

To regenerate the test files, you can run the included script:

```bash
cd /path/to/conversion-microservices/packages/conversion-service/tests/fixtures
node generate-test-files.js
```

The script will attempt to use external tools if available:
- `wkhtmltopdf` for HTML to PDF conversion
- `pandoc` for DocBook to DOCX conversion

If these tools are not available, the script will fall back to generating simple files.

## Using the Test Files

These test fixtures are used in the conversion service tests to verify the functionality of the PDF to DOCX and DOCX to PDF conversion services. The tests check various aspects of the conversion, including:

1. Basic conversion functionality
2. Handling of different quality settings
3. Progress reporting during conversion
4. Error handling
5. Content integrity in different document types (text-heavy, formatted, images, tables)

## Adding New Test Files

To add new test files:

1. Create a new HTML file for PDF sources or a new DocBook XML file for DOCX sources
2. Add the file name to the appropriate array in `generate-test-files.js`
3. Run the script to generate the new test files
4. Update the tests to use the new test files if needed