const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Service URLs - read from environment variables or use defaults
const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || 'http://localhost:3001';
const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || 'http://localhost:3002';
const QR_SERVICE_URL = process.env.QR_SERVICE_URL || 'http://localhost:3003';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3004';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Service endpoints
app.use('/api/pdf', require('./routes/pdf-routes'));
app.use('/api/image', require('./routes/image-routes'));
app.use('/api/qr', require('./routes/qr-routes'));
app.use('/api/auth', require('./routes/auth-routes'));

// Special route for PDF downloads with pdf-service prefix
app.use('/pdf-service', require('./routes/pdf-routes'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    service: 'gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      pdf: { url: PDF_SERVICE_URL, status: 'unknown' },
      image: { url: IMAGE_SERVICE_URL, status: 'unknown' },
      qr: { url: QR_SERVICE_URL, status: 'unknown' },
      auth: { url: AUTH_SERVICE_URL, status: 'unknown' }
    }
  };
  
  // Return basic health information immediately
  res.json(healthStatus);
});

app.listen(PORT, () => {
  console.log(`Gateway service running on port ${PORT}`);
  console.log('Available services:');
  console.log(`- PDF Service: ${PDF_SERVICE_URL}`);
  console.log(`- Image Service: ${IMAGE_SERVICE_URL}`);
  console.log(`- QR Service: ${QR_SERVICE_URL}`);
  console.log(`- Auth Service: ${AUTH_SERVICE_URL}`);
});