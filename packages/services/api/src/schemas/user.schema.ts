import { z } from 'zod';

/**
 * User registration schema
 */
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long' })
      .max(50, { message: 'Name cannot exceed 50 characters' }),
    email: z
      .string()
      .email({ message: 'Invalid email address' })
      .min(5, { message: 'Email must be at least 5 characters long' })
      .max(100, { message: 'Email cannot exceed 100 characters' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' })
      .max(50, { message: 'Password cannot exceed 50 characters' })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      }),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

/**
 * Login schema
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email({ message: 'Invalid email address' }),
    password: z
      .string()
      .min(1, { message: 'Password is required' }),
  }),
});

/**
 * Password update schema
 */
export const updatePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(1, { message: 'Current password is required' }),
    newPassword: z
      .string()
      .min(8, { message: 'New password must be at least 8 characters long' })
      .max(50, { message: 'New password cannot exceed 50 characters' })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      }),
    confirmNewPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  }),
});

/**
 * Profile update schema
 */
export const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long' })
      .max(50, { message: 'Name cannot exceed 50 characters' })
      .optional(),
  }),
});