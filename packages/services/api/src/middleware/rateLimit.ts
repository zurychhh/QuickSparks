import { rateLimit } from 'express-rate-limit';
import env from '../config/env';

/**
 * Global rate limiter middleware
 * Limits the number of requests a client can make within a specific time window
 */
const globalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // Default: 15 minutes
  max: env.RATE_LIMIT_MAX, // Default: 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 'error',
    message: 'Too many requests, please try again later',
  },
});

/**
 * Authentication rate limiter middleware
 * Limits authentication attempts (login, register, password reset)
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later',
  },
});

/**
 * Conversion rate limiter middleware
 * Limits file conversion requests
 */
const conversionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Conversion rate limit exceeded, please try again later',
  },
});

export { globalRateLimit, authRateLimit, conversionRateLimit };