const express = require('express');
const router = express.Router();
const http = require('http');
const url = require('url');

// Read environment variables or use defaults
const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || 'http://localhost:3001';

// Parse the service URL for hostname and port
const parsedPdfServiceUrl = url.parse(PDF_SERVICE_URL);
const PDF_HOST = parsedPdfServiceUrl.hostname || 'localhost';
const PDF_PORT = parsedPdfServiceUrl.port || 3001;

// Forward requests to PDF service
router.post('/convert', (req, res) => {
  const options = {
    hostname: PDF_HOST,
    port: PDF_PORT,
    path: '/convert',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => {
      data += chunk;
    });
    proxyRes.on('end', () => {
      res.status(proxyRes.statusCode).send(data);
    });
  });

  proxyReq.on('error', (error) => {
    console.error('Error forwarding to PDF service:', error);
    res.status(503).json({ error: 'PDF service unavailable' });
  });

  proxyReq.write(JSON.stringify(req.body));
  proxyReq.end();
});

// Handle PDF downloads - direct path from PDF service
router.get('/downloads/:filename', (req, res) => {
  const filename = req.params.filename;
  handlePdfDownload(filename, res);
});

// Also handle the path with pdf-service prefix that's returned in the response
router.get('/pdf-service/downloads/:filename', (req, res) => {
  const filename = req.params.filename;
  handlePdfDownload(filename, res);
});

// Helper function to handle PDF downloads
function handlePdfDownload(filename, res) {
  const options = {
    hostname: PDF_HOST,
    port: PDF_PORT,
    path: `/downloads/${filename}`,
    method: 'GET',
  };

  // Pipe the PDF file directly from the PDF service to the client
  const proxyReq = http.request(options, (proxyRes) => {
    // Forward headers
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    // Pipe the response directly
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    console.error('Error forwarding PDF download request:', error);
    res.status(503).json({ error: 'PDF service unavailable or file not found' });
  });

  proxyReq.end();
}

// Other PDF-related routes
router.get('/status', (req, res) => {
  // Check if PDF service is available
  const options = {
    hostname: PDF_HOST,
    port: PDF_PORT,
    path: '/status',
    method: 'GET'
  };

  const proxyReq = http.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => {
      data += chunk;
    });
    proxyRes.on('end', () => {
      res.status(proxyRes.statusCode).send(data);
    });
  });

  proxyReq.on('error', () => {
    res.status(503).json({ status: 'offline' });
  });

  proxyReq.end();
});

module.exports = router;