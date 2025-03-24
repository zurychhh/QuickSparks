const express = require('express');
const router = express.Router();
const http = require('http');

// Forward requests to Image service
router.post('/convert', (req, res) => {
  const options = {
    hostname: 'localhost',
    port: 3002,
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
    console.error('Error forwarding to Image service:', error);
    res.status(503).json({ error: 'Image service unavailable' });
  });

  proxyReq.write(JSON.stringify(req.body));
  proxyReq.end();
});

// Other image-related routes
router.get('/status', (req, res) => {
  // Check if Image service is available
  const options = {
    hostname: 'localhost',
    port: 3002,
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