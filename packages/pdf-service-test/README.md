# PDF Service Test Environment

A test environment for comparing different PDF conversion libraries in terms of quality, performance, and features.

## Overview

This package provides a testing framework to evaluate and compare various PDF conversion libraries for the QuickSparks platform. It focuses on:

- PDF to DOCX conversion
- DOCX to PDF conversion
- Quality assessment
- Performance benchmarking
- API for testing different converters

## Features

- **Multiple Converter Implementations**:
  - **pdf-lib**: Basic PDF to DOCX conversion
  - **pdf2json**: Advanced layout-aware PDF to DOCX conversion
  - **pdfjs**: Full-featured PDF to DOCX conversion with table detection
  - **mammoth**: DOCX to PDF conversion

- **Quality Assessment**:
  - Text accuracy
  - Structure preservation
  - Style preservation
  - Image handling
  - Table quality

- **Performance Benchmarking**:
  - Execution time
  - Memory usage
  - Multiple iterations for statistical significance

- **REST API**:
  - Convert PDF to DOCX
  - Convert DOCX to PDF
  - Compare multiple conversion methods

## Installation

```bash
# Install dependencies
npm install

# Generate test documents
npm run generate-test-docx
```

## Usage

### Starting the Test Server

```bash
npm run dev
```

The server will be available at `http://localhost:3010`.

### API Endpoints

- **POST /convert/pdf-to-docx**: Convert PDF to DOCX
  - Parameters:
    - `file` (multipart/form-data): PDF file to convert
    - `library` (form field): Converter to use (`pdf-lib`, `pdf2json`, or `pdfjs`)

- **POST /convert/docx-to-pdf**: Convert DOCX to PDF
  - Parameters:
    - `file` (multipart/form-data): DOCX file to convert
    - `library` (form field): Converter to use (currently only `mammoth`)

- **POST /compare**: Compare multiple conversion methods
  - Parameters:
    - `file` (multipart/form-data): PDF or DOCX file to test

### Running Benchmarks

```bash
npm run benchmark
```

This will run performance tests on all converters with the test files.

### Testing Conversion Quality

```bash
npm run quality-test
```

This evaluates the quality of conversion results across multiple metrics.

## Converter Implementations

### PDF to DOCX Converters

1. **pdf-lib-converter**:
   - Uses pdf-lib for PDF parsing
   - Basic text extraction and document structure
   - Fastest but limited structure preservation

2. **pdf2json-converter**:
   - Uses pdf2json for PDF parsing
   - Better text positioning and layout detection
   - Good balance of speed and quality

3. **pdfjs-converter**:
   - Uses Mozilla's pdf.js for PDF parsing
   - Advanced text and structure extraction
   - Best table detection and formatting preservation
   - Slowest but highest quality

### DOCX to PDF Converter

1. **mammoth-converter**:
   - Uses mammoth for DOCX parsing
   - Preserves text formatting and document structure
   - Handles tables and formatting
   - Supports HTML intermediate format for better structure preservation

## Test Document Generation

The package includes scripts to generate test documents:

- `generate-test-docx.js`: Creates a structured DOCX file with headings, formatted text, lists, and tables
- `generate-test-pdf.js`: Creates a test PDF with various elements for testing extraction

## Results

Benchmark and quality test results are saved to the `results/` directory in JSON format, allowing for:

- Comparison between different libraries
- Tracking improvements over time
- Identifying strengths and weaknesses of each approach

## Development

### Project Structure

```
pdf-service-test/
├── src/
│   ├── converters/          # Converter implementations
│   │   ├── pdf-lib-converter.js
│   │   ├── pdf2json-converter.js
│   │   ├── pdfjs-converter.js
│   │   └── mammoth-converter.js
│   ├── benchmark.js         # Performance benchmarking
│   ├── generate-test-docx.js # Test DOCX generator
│   ├── generate-test-pdf.js  # Test PDF generator
│   ├── index.js             # API server
│   ├── quality-test.js      # Quality assessment
│   └── test-api.js          # API testing script
├── test-files/              # Test documents
├── outputs/                 # Conversion outputs
└── results/                 # Test results
```

### Adding a New Converter

1. Create a new converter file in `src/converters/`
2. Implement the required conversion methods
3. Update `src/index.js` to include the new converter
4. Update `src/benchmark.js` and `src/quality-test.js` to test the new converter

## Conclusion

Based on the implementation and testing so far:

- **pdf-lib** is the fastest converter but produces the lowest quality output
- **pdf2json** offers a good balance of speed and quality
- **pdfjs** produces the highest quality output but is the slowest
- **mammoth** works well for DOCX to PDF conversion with good structure preservation

The test environment provides a framework for continuous evaluation and improvement of conversion quality, which is a key differentiator for the QuickSparks platform.