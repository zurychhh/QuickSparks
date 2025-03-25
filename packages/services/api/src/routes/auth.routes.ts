import express from 'express';
import {
  register,
  login,
  getCurrentUser,
  updateProfile,
  updatePassword,
} from '../controllers/auth.controller';
import { validate } from '../middleware/validation';
import { registerSchema, loginSchema, updatePasswordSchema, updateProfileSchema } from '../schemas/user.schema';
import { authMiddleware } from '../middleware/auth';
import { authRateLimit } from '../middleware/rateLimit';

const router = express.Router();

/**
 * Authentication Routes
 */

// Register new user
router.post('/register', authRateLimit, validate(registerSchema), register);

// Login user
router.post('/login', authRateLimit, validate(loginSchema), login);

// Get current user profile
router.get('/me', authMiddleware, getCurrentUser);

// Update user profile
router.put('/profile', authMiddleware, validate(updateProfileSchema), updateProfile);

// Update user password
router.put('/password', authMiddleware, validate(updatePasswordSchema), updatePassword);

export default router;