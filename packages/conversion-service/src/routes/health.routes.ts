import express from 'express';
import IORedis from 'ioredis';
import mongoose from 'mongoose';
import env from '../config/env';

const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'conversion-service',
    time: new Date().toISOString()
  });
});

// Detailed health check
router.get('/details', async (req, res) => {
  // Check MongoDB connection
  const mongoStatus = {
    connected: mongoose.connection.readyState === 1
  };
  
  // Check Redis connection
  let redisStatus = { connected: false, error: null };
  
  try {
    const redis = new IORedis({
      host: new URL(env.REDIS_URI).hostname,
      port: parseInt(new URL(env.REDIS_URI).port || '6379', 10),
      password: new URL(env.REDIS_URI).password || undefined,
      connectTimeout: 2000
    });
    
    const pingResult = await redis.ping();
    redisStatus.connected = pingResult === 'PONG';
    
    await redis.quit();
  } catch (error) {
    redisStatus.error = error instanceof Error ? error.message : 'Unknown Redis error';
  }
  
  // Check file storage
  const storageStatus = {
    uploadsDir: env.UPLOADS_DIR,
    outputsDir: env.OUTPUTS_DIR
  };
  
  // Check environment
  const environmentStatus = {
    nodeEnv: env.NODE_ENV,
    queueName: env.QUEUE_NAME
  };
  
  res.status(mongoStatus.connected && redisStatus.connected ? 200 : 500).json({
    status: mongoStatus.connected && redisStatus.connected ? 'ok' : 'error',
    service: 'conversion-service',
    time: new Date().toISOString(),
    environment: environmentStatus,
    dependencies: {
      mongodb: mongoStatus,
      redis: redisStatus
    },
    storage: storageStatus
  });
});

// Test CORS configuration
router.get('/test-cors', (req, res) => {
  console.log('CORS test endpoint accessed');
  
  res.status(200).json({
    message: 'CORS is working correctly',
    requestHeaders: {
      origin: req.headers.origin,
      referer: req.headers.referer
    },
    corsHeaders: {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers'),
      'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials')
    },
    timestamp: new Date().toISOString()
  });
});

// Debugging endpoint to help diagnose issues
router.get('/debug', (req, res) => {
  const debugInfo = {
    server: {
      environment: env.NODE_ENV,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version
    },
    request: {
      headers: req.headers,
      ip: req.ip,
      originalUrl: req.originalUrl,
      protocol: req.protocol,
      secure: req.secure
    },
    configuration: {
      frontendUrl: env.FRONTEND_URL,
      port: env.PORT,
      mongodbUri: env.MONGODB_URI ? '✓ Set' : '✗ Not set',
      redisUri: env.REDIS_URI ? '✓ Set' : '✗ Not set',
      uploadsDir: env.UPLOADS_DIR,
      outputsDir: env.OUTPUTS_DIR
    }
  };
  
  res.status(200).json(debugInfo);
});

export default router;