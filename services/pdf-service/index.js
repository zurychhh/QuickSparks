const express = require('express');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const createApp = () => {
  const app = express();
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // CORS configuration
  app.use((req, res, next) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000', 'https://pdfspark.app'];
      
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || !origin) {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
  
  // Middleware
  app.use(express.json());
  
  // Routes
  app.get('/status', (req, res) => {
    res.json({ status: 'online', service: 'pdf-service' });
  });
  
  // Health check endpoint with detailed information
  app.get('/health', (req, res) => {
    try {
      // Check if uploads directory is writable
      const testFile = path.join(uploadsDir, `test-${Date.now()}.txt`);
      fs.writeFileSync(testFile, 'health check');
      fs.unlinkSync(testFile);
      
      res.json({
        status: 'healthy',
        service: 'pdf-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        storage: {
          writable: true
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        service: 'pdf-service',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  app.post('/convert', async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }
      
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      
      page.drawText(text, {
        x: 50,
        y: height - 50,
        size: 12,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
      
      // Save PDF to file
      const fileName = `document-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(filePath, pdfBytes);
      
      // In a real app, you'd store this file somewhere permanent
      // and potentially use a CDN or object storage
      const fileUrl = `/pdf-service/downloads/${fileName}`;
      
      res.json({
        url: fileUrl,
        fileName,
        message: 'PDF created successfully'
      });
    } catch (error) {
      console.error('Error creating PDF:', error);
      res.status(500).json({ error: 'Failed to create PDF' });
    }
  });
  
  // Serve generated PDFs
  app.use('/downloads', express.static(uploadsDir));
  
  return app;
};

// Create the app
const app = createApp();

// Only start the server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PDF_SERVICE_PORT || 3001;
  app.listen(PORT, () => {
    console.log(`PDF service running on port ${PORT}`);
  });
}

// Export for testing
module.exports = app;
module.exports._router = createApp();