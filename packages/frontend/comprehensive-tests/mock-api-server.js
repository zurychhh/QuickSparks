// mock-api-server.js
import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Mock API Routes
app.get('/pdfspark/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.get('/pdfspark/api/conversion/status', (req, res) => {
  const id = req.query.id;
  
  if (!id) {
    return res.status(400).json({ error: 'Missing conversion ID' });
  }
  
  // Mock status for test123 ID
  if (id === 'test123') {
    return res.json({
      id: 'test123',
      status: 'completed',
      progress: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  res.status(404).json({ error: 'Conversion not found' });
});

app.post('/pdfspark/api/convert', upload.single('file'), (req, res) => {
  const file = req.file;
  const conversionType = req.body.conversion_type;
  
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  if (!conversionType) {
    return res.status(400).json({ error: 'Missing conversion_type parameter' });
  }
  
  const validConversionTypes = ['pdf_to_docx', 'docx_to_pdf'];
  if (!validConversionTypes.includes(conversionType)) {
    return res.status(400).json({ error: 'Invalid conversion type' });
  }
  
  // Mock successful conversion
  res.status(202).json({
    id: `mock-${Date.now()}`,
    status: 'pending',
    message: 'Conversion started',
    file: {
      filename: file.originalname,
      size: file.size
    }
  });
});

// Mock routes for the main application
app.get('/', (req, res) => {
  res.send('<html><body><h1>PDFSpark Mock Server</h1><p>This is a mock server for testing</p></body></html>');
});

app.get('/pdfspark', (req, res) => {
  res.send('<html><body><h1>PDFSpark Mock App</h1><p>This is a mock app for testing</p></body></html>');
});

// Function to start server with port fallback
function startServer(initialPort) {
  return new Promise((resolve, reject) => {
    const server = app.listen(initialPort)
      .on('listening', () => {
        const actualPort = server.address().port;
        console.log(`Mock API server running at http://localhost:${actualPort}`);
        resolve(server);
      })
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${initialPort} is busy, using alternative port...`);
          // Try a random port instead
          const server = app.listen(0)
            .on('listening', () => {
              const actualPort = server.address().port;
              console.log(`Mock API server running at http://localhost:${actualPort}`);
              resolve(server);
            })
            .on('error', (err) => {
              console.error('Failed to start server on any port:', err);
              reject(err);
            });
        } else {
          console.error('Server error:', err);
          reject(err);
        }
      });
  });
}

// Don't start the server immediately when imported, let the importing code start it
let server = null;

// Export factory function instead of server instance
export default {
  start: async () => {
    if (!server) {
      server = await startServer(port);
    }
    return server;
  },
  close: (callback) => {
    if (server) {
      server.close(callback);
      server = null;
    } else if (callback) {
      callback();
    }
  },
  getServer: () => server
};