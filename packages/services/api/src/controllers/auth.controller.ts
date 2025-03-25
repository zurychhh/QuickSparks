import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { ApiError } from '../utils/errorHandler';
import { successResponse } from '../utils/apiResponse';
import env from '../config/env';

/**
 * Generate JWT token
 * 
 * @param userId User ID to encode in token
 * @returns JWT token
 */
const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Register a new user
 * 
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError('Email already in use', 400);
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      plan: 'free',
    });
    
    // Generate token
    const token = generateToken(user._id);
    
    // Send response
    successResponse(
      res,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          plan: user.plan,
        },
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * 
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }
    
    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      throw new ApiError('Invalid credentials', 401);
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    // Send response
    successResponse(
      res,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          plan: user.plan,
        },
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * 
 * @route GET /api/auth/me
 * @access Private
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    
    successResponse(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          isEmailVerified: user.isEmailVerified,
        },
      },
      'User profile retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * 
 * @route PUT /api/auth/profile
 * @access Private
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.body;
    const userId = req.user._id;
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      throw new ApiError('User not found', 404);
    }
    
    successResponse(
      res,
      {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          plan: updatedUser.plan,
        },
      },
      'Profile updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update user password
 * 
 * @route PUT /api/auth/password
 * @access Private
 */
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;
    
    // Find user with password
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Check current password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    
    if (!isPasswordMatch) {
      throw new ApiError('Current password is incorrect', 401);
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    successResponse(res, null, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};