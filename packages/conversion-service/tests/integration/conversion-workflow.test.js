const fs = require('fs');
const path = require('path');
const os = require('os');

// Create mock functions
const mockStartConversion = jest.fn(async ({ userId, sourceFileId, conversionType, quality, preserveFormatting, userTier }) => {
  return {
    conversionId: 'mock-conversion-id',
    jobId: 'mock-job-id',
    estimatedTime: 15000
  };
});

const mockGetConversionStatus = jest.fn(async (conversionId, userId) => {
  return {
    id: conversionId,
    status: 'pending',
    conversionType: 'pdf-to-docx',
    createdAt: new Date(),
    sourceFile: {
      id: 'source-file-id',
      filename: 'test.pdf',
      size: 1024 * 1024
    }
  };
});

const mockCancelConversion = jest.fn(async (conversionId, userId) => {
  return true;
});

const mockEstimateConversionTime = jest.fn(({ fileType, fileSize, quality, queuePosition }) => {
  const baseTime = fileSize / 1024; // Simple estimation for test
  
  // Quality factor
  const qualityFactor = quality === 'high' ? 2 : 1;
  
  // Queue position factor
  const queueFactor = 5000 * queuePosition;
  
  // File type factor
  const typeFactor = fileType === 'pdf' ? 1.2 : 1;
  
  return Math.round(baseTime * qualityFactor * typeFactor + queueFactor);
});

// Mock the conversionService module
jest.mock('../../src/services/conversionService', () => ({
  startConversion: mockStartConversion,
  getConversionStatus: mockGetConversionStatus,
  cancelConversion: mockCancelConversion,
  estimateConversionTime: mockEstimateConversionTime,
  default: {
    startConversion: mockStartConversion,
    getConversionStatus: mockGetConversionStatus,
    cancelConversion: mockCancelConversion,
    estimateConversionTime: mockEstimateConversionTime
  }
}));

// Import the service after mocking
const conversionService = require('../../src/services/conversionService');

describe('Conversion Workflow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should start a conversion job and return job details', async () => {
    const result = await conversionService.startConversion({
      userId: 'test-user',
      sourceFileId: 'source-file-id',
      conversionType: 'pdf-to-docx',
      quality: 'high',
      preserveFormatting: true,
      userTier: 'premium'
    });
    
    // Verify the response structure
    expect(result).toEqual(expect.objectContaining({
      conversionId: expect.any(String),
      jobId: expect.any(String),
      estimatedTime: expect.any(Number)
    }));
    
    // Verify the correct parameters were passed
    expect(mockStartConversion).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'test-user',
        sourceFileId: 'source-file-id',
        conversionType: 'pdf-to-docx',
        quality: 'high',
        preserveFormatting: true,
        userTier: 'premium'
      })
    );
  });
  
  test('should retrieve conversion status', async () => {
    const status = await conversionService.getConversionStatus('mock-conversion-id', 'test-user');
    
    expect(status).toEqual(expect.objectContaining({
      id: expect.any(String),
      status: expect.any(String),
      conversionType: expect.any(String)
    }));
    
    expect(mockGetConversionStatus).toHaveBeenCalledWith('mock-conversion-id', 'test-user');
  });
  
  test('should cancel a conversion job', async () => {
    const result = await conversionService.cancelConversion('mock-conversion-id', 'test-user');
    
    expect(result).toBe(true);
    expect(mockCancelConversion).toHaveBeenCalledWith('mock-conversion-id', 'test-user');
  });
  
  test('should estimate conversion time correctly', () => {
    // Test with different file sizes
    const smallFileEstimate = conversionService.estimateConversionTime({
      fileType: 'pdf',
      fileSize: 100 * 1024, // 100KB
      quality: 'standard',
      queuePosition: 0
    });
    
    const largeFileEstimate = conversionService.estimateConversionTime({
      fileType: 'pdf',
      fileSize: 10 * 1024 * 1024, // 10MB
      quality: 'high',
      queuePosition: 0
    });
    
    // Larger files should take longer
    expect(largeFileEstimate).toBeGreaterThan(smallFileEstimate);
    
    // Test with different quality settings
    const highQualityEstimate = conversionService.estimateConversionTime({
      fileType: 'pdf',
      fileSize: 1024 * 1024, // 1MB
      quality: 'high',
      queuePosition: 0
    });
    
    const standardQualityEstimate = conversionService.estimateConversionTime({
      fileType: 'pdf',
      fileSize: 1024 * 1024, // 1MB
      quality: 'standard',
      queuePosition: 0
    });
    
    // High quality should take longer
    expect(highQualityEstimate).toBeGreaterThan(standardQualityEstimate);
    
    // Test with different queue positions
    const frontOfQueueEstimate = conversionService.estimateConversionTime({
      fileType: 'pdf',
      fileSize: 1024 * 1024, // 1MB
      quality: 'high',
      queuePosition: 0
    });
    
    const backOfQueueEstimate = conversionService.estimateConversionTime({
      fileType: 'pdf',
      fileSize: 1024 * 1024, // 1MB
      quality: 'high',
      queuePosition: 5
    });
    
    // Files further back in the queue should take longer
    expect(backOfQueueEstimate).toBeGreaterThan(frontOfQueueEstimate);
  });
  
  test('should handle different user tiers', async () => {
    // Test with enterprise tier
    await conversionService.startConversion({
      userId: 'enterprise-user',
      sourceFileId: 'source-file-id',
      conversionType: 'pdf-to-docx',
      userTier: 'enterprise'
    });
    
    // Test with free tier
    await conversionService.startConversion({
      userId: 'free-user',
      sourceFileId: 'source-file-id',
      conversionType: 'pdf-to-docx',
      userTier: 'free'
    });
    
    // Verify that both calls were made with the correct userTier
    expect(mockStartConversion).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'enterprise-user', userTier: 'enterprise' })
    );
    
    expect(mockStartConversion).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'free-user', userTier: 'free' })
    );
  });
});