import { Queue, Worker, Job, QueueScheduler, ConnectionOptions, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import env from './env';
import logger from '../utils/logger';
import { ConversionJob, UserTier } from '../types/conversion';
import { processConversionJob } from '../jobs/conversionProcessor';
import notificationService, { NotificationEventType } from '../services/notificationService';

// Redis connection configuration
const connection: ConnectionOptions = {
  host: new URL(env.REDIS_URI).hostname,
  port: parseInt(new URL(env.REDIS_URI).port || '6379', 10),
  password: new URL(env.REDIS_URI).password || undefined
};

// Create a Redis connection
const redisClient = new IORedis(connection);

// Define job priorities based on user tier
const getTierPriority = (userTier: UserTier): number => {
  switch (userTier) {
    case 'enterprise': return 1; // Highest priority
    case 'premium': return 2;
    case 'basic': return 3;
    case 'free':
    default: return 4; // Lowest priority
  }
};

// Job retry strategy with exponential backoff and max attempts based on tier
const getRetryStrategy = (userTier: UserTier) => {
  const maxAttempts = {
    'enterprise': 5,
    'premium': 4,
    'basic': 3,
    'free': 2
  }[userTier] || 3;
  
  return {
    attempts: maxAttempts,
    backoff: {
      type: 'exponential' as const,
      delay: 5000
    }
  };
};

// Create a conversion queue
export const conversionQueue = new Queue<ConversionJob>(env.QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: {
      count: 100, // Keep the last 100 completed jobs
      age: 24 * 3600 // Keep completed jobs for 24 hours
    },
    removeOnFail: false
  }
});

// Create a queue events listener
export const queueEvents = new QueueEvents(env.QUEUE_NAME, { connection });

// Set up queue events listeners
queueEvents.on('waiting', ({ jobId, prev }) => {
  logger.debug(`Job ${jobId} is waiting`, { jobId, prev });
});

queueEvents.on('active', ({ jobId, prev }) => {
  logger.debug(`Job ${jobId} is active`, { jobId, prev });
});

queueEvents.on('completed', ({ jobId, returnvalue }) => {
  logger.debug(`Job ${jobId} completed with result`, { jobId, returnvalue });
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.debug(`Job ${jobId} failed with reason`, { jobId, failedReason });
});

queueEvents.on('progress', ({ jobId, data }) => {
  logger.debug(`Job ${jobId} reported progress`, { jobId, progress: data });
  
  // Send notification about job progress
  if (typeof data === 'object' && data !== null) {
    const { userId, conversionId, progress } = data as any;
    if (userId && conversionId && progress !== undefined) {
      notificationService.sendConversionStatusNotification(
        userId,
        conversionId,
        'processing',
        { progress }
      );
    }
  }
});

// Create a queue scheduler to handle delayed jobs
export const scheduler = new QueueScheduler(env.QUEUE_NAME, { connection });

// Add a job to the queue with priority based on user tier
export const addConversionJob = async (jobData: ConversionJob): Promise<Job<ConversionJob>> => {
  const { userTier, conversionId, userId } = jobData;
  
  // Calculate job priority based on user tier
  const priority = getTierPriority(userTier);
  
  // Get retry strategy based on user tier
  const retryOptions = getRetryStrategy(userTier);
  
  // Add job to queue with appropriate priority and options
  const job = await conversionQueue.add('conversion', jobData, {
    priority,
    ...retryOptions,
    jobId: `conversion:${conversionId}`,
    removeOnComplete: {
      count: 100,
      age: 24 * 3600
    },
    removeOnFail: false
  });
  
  logger.info(`Added conversion job to queue with priority ${priority}`, {
    jobId: job.id,
    conversionId,
    userId,
    userTier,
    priority
  });
  
  return job;
};

// Get job status and details
export const getJobStatus = async (jobId: string): Promise<any> => {
  const job = await conversionQueue.getJob(jobId);
  
  if (!job) {
    return { status: 'not_found' };
  }
  
  const state = await job.getState();
  
  return {
    id: job.id,
    status: state,
    progress: job.progress,
    data: job.data,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn
  };
};

// Initialize a worker to process conversion jobs
export const initializeWorker = (): Worker<ConversionJob> => {
  const worker = new Worker<ConversionJob>(
    env.QUEUE_NAME,
    async (job: Job<ConversionJob>) => {
      logger.info(`Processing conversion job ${job.id}`, { jobId: job.id, data: job.data });
      
      // Set initial progress
      await job.updateProgress({ 
        stage: 'initializing', 
        progress: 0,
        userId: job.data.userId,
        conversionId: job.data.conversionId
      });
      
      return await processConversionJob(job);
    },
    { 
      connection,
      concurrency: env.MAX_CONCURRENT_JOBS,
      autorun: true,
      // Process jobs based on priority
      stalledInterval: 30000, // Check for stalled jobs every 30 seconds
      lockDuration: 300000,   // 5 minutes lock duration
      lockRenewTime: 150000   // Renew lock every 2.5 minutes
    }
  );

  // Handle worker events
  worker.on('completed', (job: Job<ConversionJob>, result) => {
    logger.info(`Job ${job.id} completed`, { jobId: job.id, result });
    
    // Calculate job duration
    const duration = job.finishedOn && job.processedOn 
      ? job.finishedOn - job.processedOn 
      : undefined;
    
    // Log metrics for monitoring
    logger.info('Job metrics', {
      jobId: job.id,
      conversionId: job.data.conversionId,
      userTier: job.data.userTier,
      duration,
      attempts: job.attemptsMade,
      success: result.success
    });
  });

  worker.on('failed', (job: Job<ConversionJob> | undefined, error) => {
    if (job) {
      logger.error(`Job ${job.id} failed`, { 
        jobId: job.id, 
        conversionId: job.data.conversionId,
        userTier: job.data.userTier,
        attempts: job.attemptsMade,
        error: error.message 
      });
      
      // Notify about job failure
      notificationService.sendNotification(
        NotificationEventType.ERROR,
        {
          userId: job.data.userId,
          resourceId: job.data.conversionId,
          resourceType: 'conversion',
          status: 'failed',
          message: `Conversion failed: ${error.message}`,
          details: { jobId: job.id, error: error.message }
        }
      );
    } else {
      logger.error('Job failed without job reference', { error: error.message });
    }
  });

  worker.on('error', (error) => {
    logger.error('Worker error', error);
  });

  return worker;
};

// Get queue statistics
export const getQueueStats = async (): Promise<any> => {
  const [
    waiting,
    active,
    completed,
    failed,
    delayed,
    jobCounts
  ] = await Promise.all([
    conversionQueue.getWaitingCount(),
    conversionQueue.getActiveCount(),
    conversionQueue.getCompletedCount(),
    conversionQueue.getFailedCount(),
    conversionQueue.getDelayedCount(),
    conversionQueue.getJobCounts()
  ]);
  
  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    jobCounts
  };
};

// Gracefully shut down the queue and worker
export const shutdownQueue = async (): Promise<void> => {
  await conversionQueue.close();
  await queueEvents.close();
  await scheduler.close();
  await redisClient.quit();
  logger.info('Queue system shut down');
};

/**
 * Remove a job from the queue
 * @param jobId The ID of the job to remove
 * @returns True if the job was removed, false if not found
 */
export const removeJob = async (jobId: string): Promise<boolean> => {
  const job = await conversionQueue.getJob(jobId);
  
  if (!job) {
    return false;
  }
  
  await job.remove();
  logger.info(`Removed job ${jobId} from queue`);
  return true;
};

export default {
  conversionQueue,
  queueEvents,
  scheduler,
  initializeWorker,
  shutdownQueue,
  addConversionJob,
  getJobStatus,
  getQueueStats,
  removeJob
};