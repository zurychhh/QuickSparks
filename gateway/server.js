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
app.get('/health', async (req, res) => {
  const http = require('http');
  
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
    },
    env: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: PORT,
      host: process.env.HOST || 'localhost'
    }
  };
  
  // Include service status check if detailed param is provided
  if (req.query.detailed === 'true') {
    // Function to check if a service is reachable
    const checkServiceHealth = (url) => {
      return new Promise((resolve) => {
        const serviceUrl = new URL(url);
        const options = {
          hostname: serviceUrl.hostname,
          port: serviceUrl.port,
          path: '/health',
          method: 'GET',
          timeout: 2000, // 2 second timeout
        };
        
        const req = http.request(options, (res) => {
          if (res.statusCode === 200) {
            resolve({ status: 'healthy', statusCode: res.statusCode });
          } else {
            resolve({ status: 'unhealthy', statusCode: res.statusCode });
          }
        });
        
        req.on('error', (error) => {
          resolve({ status: 'unreachable', error: error.message });
        });
        
        req.on('timeout', () => {
          req.destroy();
          resolve({ status: 'timeout', error: 'Request timed out' });
        });
        
        req.end();
      });
    };
    
    // Check all services
    const [pdfHealth, imageHealth, qrHealth, authHealth] = await Promise.all([
      checkServiceHealth(PDF_SERVICE_URL),
      checkServiceHealth(IMAGE_SERVICE_URL),
      checkServiceHealth(QR_SERVICE_URL),
      checkServiceHealth(AUTH_SERVICE_URL)
    ]);
    
    // Update health status
    healthStatus.services.pdf.health = pdfHealth;
    healthStatus.services.image.health = imageHealth;
    healthStatus.services.qr.health = qrHealth;
    healthStatus.services.auth.health = authHealth;
    
    // Update overall status
    const serviceStatuses = [pdfHealth, imageHealth, qrHealth, authHealth];
    if (serviceStatuses.some(s => s.status === 'unreachable')) {
      healthStatus.status = 'degraded';
      healthStatus.message = 'One or more services are unreachable';
    }
  }
  
  // Add CORS headers for frontend access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  // Return health information
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