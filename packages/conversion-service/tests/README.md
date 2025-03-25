# PDF ↔ DOCX Conversion Service Tests

This directory contains comprehensive tests for the PDF to DOCX and DOCX to PDF conversion services.

## Test Structure

The tests are organized as follows:

```
tests/
├── fixtures/               # Test files for various document types
│   ├── simple.pdf          # Simple PDF document
│   ├── simple.docx         # Simple DOCX document  
│   ├── text_heavy.pdf      # Text-heavy PDF document
│   ├── text_heavy.docx     # Text-heavy DOCX document
│   ├── formatted.pdf       # PDF with rich formatting
│   ├── formatted.docx      # DOCX with rich formatting
│   ├── with_images.pdf     # PDF with embedded images
│   ├── with_images.docx    # DOCX with embedded images
│   ├── with_tables.pdf     # PDF with tables
│   ├── with_tables.docx    # DOCX with tables
│   └── generate-test-files.js  # Script to regenerate test files
├── services/               # Service-specific tests
│   ├── conversionQueue.test.ts  # Tests for the queue system
│   ├── docxToPdfService.test.ts # Tests for DOCX to PDF conversion 
│   └── pdfToDocxService.test.ts # Tests for PDF to DOCX conversion
├── utils/                  # Test utilities
│   └── tempFiles.ts        # Utilities for managing temporary test files
├── temp/                   # Temporary directory for test files (created at runtime)
├── run-tests.sh            # Script to run all tests
└── README.md               # This file
```

## Running the Tests

To run all the tests:

```bash
cd /path/to/conversion-microservices/packages/conversion-service
./tests/run-tests.sh
```

This script will:
1. Generate test fixtures if they don't exist
2. Run all the service tests

To run individual test files:

```bash
cd /path/to/conversion-microservices
npx jest packages/conversion-service/tests/services/pdfToDocxService.test.ts
```

## Test Categories

### PDF to DOCX Conversion Tests

Tests for converting PDF files to DOCX format, covering:

- Basic conversion functionality
- Different quality settings (high vs. standard)
- Real-time progress reporting
- Error handling
- Preservation of formatting
- Handling of different document types:
  - Text-heavy documents
  - Formatted documents (headings, lists, etc.)
  - Documents with images
  - Documents with tables

### DOCX to PDF Conversion Tests

Tests for converting DOCX files to PDF format, covering:

- Basic conversion functionality
- Different quality settings (high vs. standard)
- Real-time progress reporting
- Error handling
- Preservation of formatting
- Handling of different document types:
  - Text-heavy documents
  - Formatted documents (headings, lists, etc.)
  - Documents with images
  - Documents with tables

### Queue Management Tests

Tests for the job queue system, covering:

- Priority-based job processing
- Job status tracking
- Queue metrics and statistics
- User tier-based configuration
- Retry strategies

## Test Fixtures

The test fixtures include PDF and DOCX files with various content types:

- `simple.*`: Basic documents with minimal text
- `text_heavy.*`: Documents with extensive text content
- `formatted.*`: Documents with rich formatting (headings, lists, styles)
- `with_images.*`: Documents containing embedded images
- `with_tables.*`: Documents with various table structures

These fixtures can be regenerated using the script in the fixtures directory.

## Test Utilities

The tests use various utilities to manage test files:

- `tempFiles.ts`: Functions for creating, accessing, and cleaning up temporary test files
- Fixtures helpers: Functions to access the correct test fixtures for each test type

## Adding New Tests

To add new tests:

1. Create appropriate test fixtures in the fixtures directory
2. Add a new test file in the services directory
3. Implement tests following the existing patterns
4. Update the README.md if necessary