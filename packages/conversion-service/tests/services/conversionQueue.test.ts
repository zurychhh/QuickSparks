import path from 'path';
import { getTempFilePath, cleanupTempFiles } from '../utils/tempFiles';
import queueService from '../../src/config/queue';
import { ConversionJob, UserTier } from '../../src/types/conversion';

// Mock Queue class
jest.mock('bullmq', () => {
  const originalModule = jest.requireActual('bullmq');
  
  // Mock Job class
  class MockJob {
    id: string;
    data: any;
    opts: any;
    removed: boolean;
    
    constructor(id: string, data: any, opts: any) {
      this.id = id;
      this.data = data;
      this.opts = opts;
      this.removed = false;
    }
    
    async updateProgress(progress: any) {
      return Promise.resolve();
    }
    
    async getState() {
      return 'active';
    }
    
    async remove() {
      this.removed = true;
      return Promise.resolve();
    }
  }
  
  // Mock Queue class
  class MockQueue {
    name: string;
    jobs: Map<string, MockJob>;
    
    constructor(name: string) {
      this.name = name;
      this.jobs = new Map();
    }
    
    async add(name: string, data: any, opts: any) {
      const id = opts.jobId || `job-${Date.now()}`;
      const job = new MockJob(id, data, opts);
      this.jobs.set(id, job);
      return job;
    }
    
    async getJob(jobId: string) {
      return this.jobs.get(jobId);
    }
    
    async getJobs() {
      return Array.from(this.jobs.values());
    }
    
    async getWaitingCount() {
      return 0;
    }
    
    async getActiveCount() {
      return 0;
    }
    
    async getCompletedCount() {
      return 0;
    }
    
    async getFailedCount() {
      return 0;
    }
    
    async getDelayedCount() {
      return 0;
    }
    
    async getJobCounts() {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0
      };
    }
    
    async close() {
      return Promise.resolve();
    }
  }
  
  return {
    ...originalModule,
    Queue: MockQueue,
    Worker: jest.fn(),
    QueueScheduler: jest.fn(),
    QueueEvents: jest.fn(() => ({
      on: jest.fn(),
      close: jest.fn()
    }))
  };
});

describe('Conversion Queue Service', () => {
  afterAll(() => {
    cleanupTempFiles();
  });
  
  // Mock conversion job data
  const createJobData = (userTier: UserTier): ConversionJob => ({
    conversionId: `conversion-${Date.now()}`,
    userId: 'test-user',
    sourceFilePath: getTempFilePath('.pdf'),
    outputFilePath: getTempFilePath('.docx'),
    originalFilename: 'test.pdf',
    conversionType: 'pdf-to-docx',
    quality: 'high',
    preserveFormatting: true,
    userTier
  });
  
  test('should add jobs to queue with correct priority', async () => {
    // Create jobs for different user tiers
    const enterpriseJobData = createJobData('enterprise');
    const premiumJobData = createJobData('premium');
    const basicJobData = createJobData('basic');
    const freeJobData = createJobData('free');
    
    // Add jobs to queue
    const enterpriseJob = await queueService.addConversionJob(enterpriseJobData);
    const premiumJob = await queueService.addConversionJob(premiumJobData);
    const basicJob = await queueService.addConversionJob(basicJobData);
    const freeJob = await queueService.addConversionJob(freeJobData);
    
    // Enterprise should have highest priority (lowest number)
    expect(enterpriseJob.opts.priority).toBeLessThan(premiumJob.opts.priority);
    expect(premiumJob.opts.priority).toBeLessThan(basicJob.opts.priority);
    expect(basicJob.opts.priority).toBeLessThan(freeJob.opts.priority);
  });
  
  test('should configure retry attempts based on user tier', async () => {
    // Create jobs for different user tiers
    const enterpriseJobData = createJobData('enterprise');
    const freeJobData = createJobData('free');
    
    // Add jobs to queue
    const enterpriseJob = await queueService.addConversionJob(enterpriseJobData);
    const freeJob = await queueService.addConversionJob(freeJobData);
    
    // Enterprise should have more retry attempts than free
    expect(enterpriseJob.opts.attempts).toBeGreaterThan(freeJob.opts.attempts);
  });
  
  test('should get job status', async () => {
    // Create and add job
    const jobData = createJobData('premium');
    const job = await queueService.addConversionJob(jobData);
    
    // Get job status
    const status = await queueService.getJobStatus(job.id);
    
    // Check status properties
    expect(status).toHaveProperty('id');
    expect(status).toHaveProperty('status');
    expect(status).toHaveProperty('data');
    
    // Status should match job data
    expect(status.data.conversionId).toBe(jobData.conversionId);
    expect(status.data.userId).toBe(jobData.userId);
    expect(status.data.userTier).toBe(jobData.userTier);
  });
  
  test('should return queue statistics', async () => {
    // Get queue stats
    const stats = await queueService.getQueueStats();
    
    // Check stats properties
    expect(stats).toHaveProperty('waiting');
    expect(stats).toHaveProperty('active');
    expect(stats).toHaveProperty('completed');
    expect(stats).toHaveProperty('failed');
    expect(stats).toHaveProperty('delayed');
    expect(stats).toHaveProperty('jobCounts');
  });
  
  test('should remove job from queue', async () => {
    // Create and add job
    const jobData = createJobData('basic');
    const job = await queueService.addConversionJob(jobData);
    
    // Verify job exists
    const beforeRemoval = await queueService.getJobStatus(job.id);
    expect(beforeRemoval).not.toHaveProperty('status', 'not_found');
    
    // Remove job
    const result = await queueService.removeJob(job.id);
    expect(result).toBe(true);
    
    // Try to remove non-existent job
    const nonExistentResult = await queueService.removeJob('non-existent-job-id');
    expect(nonExistentResult).toBe(false);
  });
  
  test('should handle special user tier cases', async () => {
    // Create job with undefined user tier (should default to free)
    const undefinedTierData = createJobData('free');
    delete undefinedTierData.userTier;
    const undefinedTierJob = await queueService.addConversionJob(undefinedTierData as any);
    
    // Create job with invalid user tier (should default to free priority)
    const invalidTierData = createJobData('free');
    (invalidTierData as any).userTier = 'invalid-tier';
    const invalidTierJob = await queueService.addConversionJob(invalidTierData as any);
    
    // Both should have the same priority (free tier)
    expect(undefinedTierJob.opts.priority).toBe(invalidTierJob.opts.priority);
  });
});