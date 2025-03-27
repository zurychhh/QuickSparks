export type ConversionType = 'pdf-to-docx' | 'docx-to-pdf';

export type ConversionQuality = 'standard' | 'high';

export type ConversionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type UserTier = 'free' | 'basic' | 'premium' | 'enterprise';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export type PaymentProvider = 'paybylink' | 'stripe' | 'paypal';

export interface ConversionOptions {
  conversionType: ConversionType;
  quality: ConversionQuality;
  preserveFormatting: boolean;
}

export interface ConversionJob {
  conversionId: string;
  userId: string;
  sourceFilePath: string;
  outputFilePath: string;
  originalFilename: string;
  conversionType: ConversionType;
  quality: ConversionQuality;
  preserveFormatting: boolean;
  userTier: UserTier;
}

export enum ErrorCategory {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  CONVERSION_ERROR = 'CONVERSION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR', 
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  errorCategory?: ErrorCategory;
  errorDetails?: Record<string, any>;
  conversionTime?: number;
  pageCount?: number;
}

export interface PaymentRequest {
  conversionId: string;
  userId: string;
  amount: number;
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  metaData?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  paymentUrl?: string;
  error?: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  transactionId?: string;
}

export interface PaymentNotification {
  paymentId: string;
  conversionId: string;
  userId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  transactionId: string;
  timestamp: Date;
  providerData: Record<string, any>;
}