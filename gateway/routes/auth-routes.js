const express = require('express');
const router = express.Router();
const http = require('http');

// Forward requests to Authentication service
router.post('/register', (req, res) => {
  forwardRequest(req, res, '/auth/register', 'POST');
});

router.post('/login', (req, res) => {
  forwardRequest(req, res, '/auth/login', 'POST');
});

router.post('/validate', (req, res) => {
  forwardRequest(req, res, '/auth/validate', 'POST');
});

// Check auth service status
router.get('/status', (req, res) => {
  // Check if Auth service is available
  const options = {
    hostname: 'localhost',
    port: 3004,
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

// Helper function to forward requests to the auth service
function forwardRequest(req, res, path, method) {
  const options = {
    hostname: 'localhost',
    port: 3004,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  // Copy authorization header if present
  if (req.headers.authorization) {
    options.headers.Authorization = req.headers.authorization;
  }

  const proxyReq = http.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => {
      data += chunk;
    });
    proxyRes.on('end', () => {
      // Copy response status and send the data
      res.status(proxyRes.statusCode).send(data);
    });
  });

  proxyReq.on('error', (error) => {
    console.error('Error forwarding to Auth service:', error);
    res.status(503).json({ error: 'Auth service unavailable' });
  });

  if (req.body && Object.keys(req.body).length > 0) {
    proxyReq.write(JSON.stringify(req.body));
  }
  
  proxyReq.end();
}

module.exports = router;