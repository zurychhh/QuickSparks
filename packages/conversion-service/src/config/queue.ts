import { Queue, Worker, Job, QueueScheduler, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';
import env from './env';
import logger from '../utils/logger';
import { ConversionJob } from '../types/conversion';
import { processConversionJob } from '../jobs/conversionProcessor';

// Redis connection configuration
const connection: ConnectionOptions = {
  host: new URL(env.REDIS_URI).hostname,
  port: parseInt(new URL(env.REDIS_URI).port || '6379', 10),
  password: new URL(env.REDIS_URI).password || undefined
};

// Create a Redis connection
const redisClient = new IORedis(connection);

// Create a conversion queue
export const conversionQueue = new Queue<ConversionJob>(env.QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

// Create a queue scheduler to handle delayed jobs
export const scheduler = new QueueScheduler(env.QUEUE_NAME, { connection });

// Initialize a worker to process conversion jobs
export const initializeWorker = (): Worker<ConversionJob> => {
  const worker = new Worker<ConversionJob>(
    env.QUEUE_NAME,
    async (job: Job<ConversionJob>) => {
      logger.info(`Processing conversion job ${job.id}`, { jobId: job.id, data: job.data });
      return await processConversionJob(job);
    },
    { 
      connection,
      concurrency: env.MAX_CONCURRENT_JOBS,
      autorun: true
    }
  );

  // Handle worker events
  worker.on('completed', (job: Job<ConversionJob>, result) => {
    logger.info(`Job ${job.id} completed`, { jobId: job.id, result });
  });

  worker.on('failed', (job: Job<ConversionJob> | undefined, error) => {
    logger.error(`Job ${job?.id} failed`, { jobId: job?.id, error: error.message });
  });

  worker.on('error', (error) => {
    logger.error('Worker error', error);
  });

  return worker;
};

// Gracefully shut down the queue and worker
export const shutdownQueue = async (): Promise<void> => {
  await conversionQueue.close();
  await scheduler.close();
  await redisClient.quit();
  logger.info('Queue system shut down');
};

export default {
  conversionQueue,
  scheduler,
  initializeWorker,
  shutdownQueue
};