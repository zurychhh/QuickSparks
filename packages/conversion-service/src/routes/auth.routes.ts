import express from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth';
import { csrfTokenMiddleware, validateCsrfToken } from '../middleware/csrf';
import logger from '../utils/logger';
import env from '../config/env';

const router = express.Router();

/**
 * Login endpoint - creates secure HttpOnly cookie instead of returning token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Mock authentication for development
    // This would be replaced with actual authentication logic
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Mock user lookup
    const mockUserDb = {
      'test@example.com': {
        userId: 'test-user',
        email: 'test@example.com',
        tier: 'free',
        password: 'password123' // In a real app, this would be hashed
      },
      'premium@example.com': {
        userId: 'premium-user',
        email: 'premium@example.com',
        tier: 'premium',
        password: 'password123' // In a real app, this would be hashed
      }
    };
    
    // Find user
    const user = mockUserDb[email];
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Create JWT token payload
    const payload = {
      userId: user.userId,
      email: user.email,
      tier: user.tier
    };
    
    // Sign token
    const token = jwt.sign(
      payload,
      env.JWT_SECRET || 'default-secret-replace-in-production',
      { expiresIn: '1d' }
    );
    
    // Send token as HttpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    // Return success response without token in body
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.userId,
        email: user.email,
        tier: user.tier
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
});

/**
 * Logout endpoint - clears the auth cookie
 */
router.post('/logout', (req, res) => {
  // Clear the auth cookie
  res.clearCookie('auth_token');
  
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * Authentication status endpoint
 */
router.get('/status', authMiddleware, (req, res) => {
  // If authMiddleware passed, the user is authenticated
  res.status(200).json({
    success: true,
    authenticated: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      tier: req.user.tier
    }
  });
});

/**
 * CSRF token endpoint - returns a new CSRF token
 */
router.get('/csrf-token', authMiddleware, csrfTokenMiddleware);

export default router;