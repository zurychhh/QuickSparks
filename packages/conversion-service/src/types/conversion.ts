export type ConversionType = 'pdf-to-docx' | 'docx-to-pdf';

export type ConversionQuality = 'standard' | 'high';

export type ConversionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type UserTier = 'free' | 'basic' | 'premium' | 'enterprise';

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

export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  conversionTime?: number;
  pageCount?: number;
}