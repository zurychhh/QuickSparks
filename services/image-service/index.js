const express = require('express');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.IMAGE_SERVICE_PORT || 3002;

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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only accept images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware
app.use(express.json());

// Routes
app.get('/status', (req, res) => {
  res.json({ status: 'online', service: 'image-service' });
});

// Health check endpoint with detailed information
app.get('/health', (req, res) => {
  try {
    // Check if uploads directory is writable
    const testFile = path.join(uploadsDir, `test-${Date.now()}.txt`);
    fs.writeFileSync(testFile, 'health check');
    fs.unlinkSync(testFile);
    
    // Try to load Sharp to verify image processing capability
    const isSharpWorking = !!sharp;
    
    res.json({
      status: 'healthy',
      service: 'image-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      dependencies: {
        sharp: isSharpWorking ? 'available' : 'unavailable'
      },
      storage: {
        writable: true
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      service: 'image-service',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/convert', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    
    const { width, height, format } = req.body;
    
    // Validate parameters
    const outputWidth = parseInt(width) || 300;
    const outputHeight = parseInt(height) || null; // null for auto-height
    const outputFormat = format || 'jpeg';
    
    if (!['jpeg', 'png', 'webp', 'avif'].includes(outputFormat)) {
      return res.status(400).json({ error: 'Invalid format. Supported formats: jpeg, png, webp, avif' });
    }
    
    // Process the image
    const inputPath = req.file.path;
    const outputFilename = `${path.parse(req.file.filename).name}.${outputFormat}`;
    const outputPath = path.join(uploadsDir, outputFilename);
    
    // Resize and convert
    await sharp(inputPath)
      .resize(outputWidth, outputHeight)
      [outputFormat]()
      .toFile(outputPath);
    
    // Clean up original if needed
    if (inputPath !== outputPath) {
      fs.unlinkSync(inputPath);
    }
    
    // In a real app, you'd store this file somewhere permanent
    // and potentially use a CDN or object storage
    const fileUrl = `/image-service/downloads/${outputFilename}`;
    
    res.json({
      url: fileUrl,
      fileName: outputFilename,
      width: outputWidth,
      format: outputFormat,
      message: 'Image converted successfully'
    });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// Serve processed images
app.use('/downloads', express.static(uploadsDir));

// Error handler for multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading.
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB' });
    }
    return res.status(400).json({ error: err.message });
  }
  // Some other error occurred
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Image service running on port ${PORT}`);
});