/**
 * Test script for the API endpoints
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const FormData = require('form-data');

const PORT = process.env.PDF_TEST_SERVICE_PORT || 3010;
const HOST = 'localhost';

async function testDocxToPdf() {
  const form = new FormData();
  form.append('file', fs.createReadStream(path.join(__dirname, '../test-files/test-document.docx')));
  form.append('library', 'mammoth');

  return new Promise((resolve, reject) => {
    const request = http.request({
      host: HOST,
      port: PORT,
      path: '/convert/docx-to-pdf',
      method: 'POST',
      headers: form.getHeaders()
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });
    
    request.on('error', (err) => {
      reject(err);
    });
    
    form.pipe(request);
  });
}

async function testPdfToDocx() {
  const form = new FormData();
  form.append('file', fs.createReadStream(path.join(__dirname, '../test-files/test-document.pdf')));
  form.append('library', 'pdfjs');

  return new Promise((resolve, reject) => {
    const request = http.request({
      host: HOST,
      port: PORT,
      path: '/convert/pdf-to-docx',
      method: 'POST',
      headers: form.getHeaders()
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });
    
    request.on('error', (err) => {
      reject(err);
    });
    
    form.pipe(request);
  });
}

async function testCompare() {
  const form = new FormData();
  form.append('file', fs.createReadStream(path.join(__dirname, '../test-files/test-document.pdf')));

  return new Promise((resolve, reject) => {
    const request = http.request({
      host: HOST,
      port: PORT,
      path: '/compare',
      method: 'POST',
      headers: form.getHeaders()
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });
    
    request.on('error', (err) => {
      reject(err);
    });
    
    form.pipe(request);
  });
}

// Run tests
async function runTests() {
  try {
    console.log("Testing DOCX to PDF conversion...");
    const docxToPdfResult = await testDocxToPdf();
    console.log("DOCX to PDF result:", JSON.stringify(docxToPdfResult, null, 2));
    
    console.log("\nTesting PDF to DOCX conversion...");
    const pdfToDocxResult = await testPdfToDocx();
    console.log("PDF to DOCX result:", JSON.stringify(pdfToDocxResult, null, 2));
    
    console.log("\nTesting comparison endpoint...");
    const compareResult = await testCompare();
    console.log("Compare result:", JSON.stringify(compareResult, null, 2));
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testDocxToPdf,
  testPdfToDocx,
  testCompare
};