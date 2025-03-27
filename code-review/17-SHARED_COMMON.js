/**
 * 17-SHARED_COMMON.js
 * 
 * This file contains shared types, interfaces, and utility functions.
 */

// Common TypeScript Interfaces
// ========================
// packages/shared/src/index.ts
const sharedInterfaces = `
/**
 * Common interfaces used across the project
 */

// Conversion type
export type ConversionType = 'pdf-to-docx' | 'docx-to-pdf';

// Conversion status
export type ConversionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Conversion options
export interface ConversionOptions {
  quality: 'low' | 'medium' | 'high';
  preserveImages: boolean;
  preserveFormatting: boolean;
  extractTables?: boolean;
  optimizeForPrinting?: boolean;
  [key: string]: any;
}

// Conversion request
export interface ConversionRequest {
  conversionType: ConversionType;
  options?: Partial<ConversionOptions>;
}

// Conversion response
export interface ConversionResponse {
  conversionId: string;
  message: string;
}

// Conversion status response
export interface ConversionStatusResponse {
  id: string;
  fileName: string;
  status: ConversionStatus;
  progress: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  downloadUrl?: string;
  paymentRequired: boolean;
}

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  isSubscribed: boolean;
  subscriptionTier?: string;
  createdAt: string;
}

// Auth response
export interface AuthResponse {
  token: string;
  user: User;
}

// Checkout session request
export interface CheckoutSessionRequest {
  conversionId: string;
  successUrl: string;
  cancelUrl: string;
}

// Checkout session response
export interface CheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
}

// Payment verification response
export interface PaymentVerificationResponse {
  status: string;
  message: string;
  downloadUrl?: string;
}

// Download info response
export interface DownloadInfoResponse {
  available: boolean;
  fileName: string;
  fileSize?: number;
  conversionType: ConversionType;
  requiresPayment: boolean;
}

// WebSocket conversion status update
export interface ConversionStatusUpdate {
  status: ConversionStatus | 'error';
  progress?: number;
  message?: string;
  fileName?: string;
  thumbnailUrl?: string;
  fileUrl?: string;
  paymentRequired?: boolean;
}

// API error response
export interface ApiError {
  error: boolean;
  message: string;
  details?: any;
  stack?: string;
}
`;

// Request Validation Schemas
// =====================
// packages/shared/src/schemas/conversion.schema.ts
const validationSchemas = `
import { z } from 'zod';

/**
 * Validation schemas for API requests
 */

// Conversion request schema
export const conversionRequestSchema = z.object({
  conversionType: z.enum(['pdf-to-docx', 'docx-to-pdf']),
  options: z.object({
    quality: z.enum(['low', 'medium', 'high']).optional().default('high'),
    preserveImages: z.boolean().optional().default(true),
    preserveFormatting: z.boolean().optional().default(true),
    extractTables: z.boolean().optional(),
    optimizeForPrinting: z.boolean().optional(),
  }).optional(),
});

// Authentication request schema
export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Registration request schema
export const registerRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

// Checkout session request schema
export const checkoutSessionRequestSchema = z.object({
  conversionId: z.string(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

// Payment verification request schema
export const paymentVerificationRequestSchema = z.object({
  sessionId: z.string(),
});
`;

// Common Frontend Utilities
// =====================
// packages/frontend/src/utils/classnames.ts
const classNamesUtil = `
/**
 * Utility for conditionally joining CSS class names
 */
export function classNames(...classes: (string | boolean | undefined | null | { [key: string]: boolean })[]): string {
  return classes
    .filter(Boolean)
    .map((item) => {
      if (typeof item === 'object') {
        return Object.entries(item)
          .filter(([_, value]) => Boolean(value))
          .map(([key]) => key)
          .join(' ');
      }
      return item;
    })
    .join(' ');
}

/**
 * Example usage:
 * 
 * classNames('text-red-500', isActive && 'font-bold', { 'bg-blue-500': isHighlighted })
 * => If isActive is true and isHighlighted is true: 'text-red-500 font-bold bg-blue-500'
 * => If isActive is false and isHighlighted is true: 'text-red-500 bg-blue-500'
 * => If isActive is true and isHighlighted is false: 'text-red-500 font-bold'
 */
`;

// Environment Utilities
// =================
// packages/frontend/src/utils/env.ts
const envUtil = `
/**
 * Environment variables utility for frontend
 */

// Type definition for environment variables
interface Env {
  NODE_ENV: 'development' | 'production' | 'test';
  API_URL?: string;
  STRIPE_PUBLIC_KEY?: string;
  ANALYTICS_ID?: string;
  SENTRY_DSN?: string;
}

// Define environment variables with defaults
export const env: Env = {
  NODE_ENV: (import.meta.env.MODE || 'development') as Env['NODE_ENV'],
  API_URL: import.meta.env.VITE_API_URL,
  STRIPE_PUBLIC_KEY: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  ANALYTICS_ID: import.meta.env.VITE_ANALYTICS_ID,
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
};

// Helper functions
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';
export const isProduction = (): boolean => env.NODE_ENV === 'production';
export const isTest = (): boolean => env.NODE_ENV === 'test';
`;

// Analytics Utility
// =============
// packages/frontend/src/utils/analytics.ts
const analyticsUtil = `
import { env } from './env';

// Simple analytics wrapper
let analyticsInitialized = false;

/**
 * Initialize analytics
 */
export function initAnalytics(): void {
  if (analyticsInitialized || !env.ANALYTICS_ID) {
    return;
  }
  
  try {
    // This would typically load an analytics script like Google Analytics or Plausible
    console.log('Initializing analytics with ID:', env.ANALYTICS_ID);
    
    // Example loading Google Analytics
    /*
    const script = document.createElement('script');
    script.async = true;
    script.src = \`https://www.googletagmanager.com/gtag/js?id=\${env.ANALYTICS_ID}\`;
    document.head.appendChild(script);
    
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', env.ANALYTICS_ID);
    */
    
    analyticsInitialized = true;
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string): void {
  if (!analyticsInitialized) {
    initAnalytics();
  }
  
  if (!env.ANALYTICS_ID) {
    return;
  }
  
  try {
    console.log('Track page view:', path);
    
    // Example using Google Analytics
    /*
    if (window.gtag) {
      window.gtag('config', env.ANALYTICS_ID, {
        page_path: path,
      });
    }
    */
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}

/**
 * Track event
 */
export function trackEvent(
  eventName: string, 
  properties?: Record<string, any>
): void {
  if (!analyticsInitialized) {
    initAnalytics();
  }
  
  if (!env.ANALYTICS_ID) {
    return;
  }
  
  try {
    console.log('Track event:', eventName, properties);
    
    // Example using Google Analytics
    /*
    if (window.gtag) {
      window.gtag('event', eventName, properties);
    }
    */
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}
`;

// A/B Testing Utility
// ===============
// packages/frontend/src/utils/ab-testing.ts
const abTestingUtil = `
import { env } from './env';
import { trackEvent } from './analytics';

// A/B test variant type
type Variant = 'control' | 'variant_a' | 'variant_b';

// A/B test definition
interface ABTest {
  id: string;
  variants: Variant[];
  weights?: number[]; // Optional weights for non-uniform distribution
}

// Available A/B tests
const availableTests: Record<string, ABTest> = {
  'homepage-layout': {
    id: 'homepage-layout',
    variants: ['control', 'variant_a', 'variant_b'],
    weights: [0.5, 0.25, 0.25], // 50% control, 25% variant A, 25% variant B
  },
  'pricing-display': {
    id: 'pricing-display',
    variants: ['control', 'variant_a'],
    weights: [0.5, 0.5], // 50% control, 50% variant A
  },
  'conversion-flow': {
    id: 'conversion-flow',
    variants: ['control', 'variant_a'],
    weights: [0.6, 0.4], // 60% control, 40% variant A
  },
};

/**
 * Get variant for a specific A/B test
 */
export async function getVariant(testId: string): Promise<Variant> {
  // Get test definition
  const test = availableTests[testId];
  
  if (!test) {
    console.warn(\`A/B test \${testId} not found, defaulting to control\`);
    return 'control';
  }
  
  // Check if variant is already assigned in localStorage
  const storedVariant = localStorage.getItem(\`ab_test_\${testId}\`);
  
  if (storedVariant && test.variants.includes(storedVariant as Variant)) {
    return storedVariant as Variant;
  }
  
  // Assign a new variant
  const variant = assignVariant(test);
  
  // Store in localStorage for consistency
  localStorage.setItem(\`ab_test_\${testId}\`, variant);
  
  return variant;
}

/**
 * Assign a variant based on test definition
 */
function assignVariant(test: ABTest): Variant {
  const { variants, weights } = test;
  
  // If no weights provided, use uniform distribution
  if (!weights || weights.length !== variants.length) {
    const randomIndex = Math.floor(Math.random() * variants.length);
    return variants[randomIndex];
  }
  
  // Weighted random selection
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return variants[i];
    }
  }
  
  // Fallback to control
  return 'control';
}

/**
 * Track impression for a variant
 */
export function trackVariantImpression(testId: string, variant: string): void {
  if (!env.ANALYTICS_ID) {
    return;
  }
  
  trackEvent('ab_test_impression', {
    test_id: testId,
    variant,
  });
}

/**
 * Track conversion for a variant
 */
export function trackVariantConversion(testId: string, variant: string, conversionType: string): void {
  if (!env.ANALYTICS_ID) {
    return;
  }
  
  trackEvent('ab_test_conversion', {
    test_id: testId,
    variant,
    conversion_type: conversionType,
  });
}
`;