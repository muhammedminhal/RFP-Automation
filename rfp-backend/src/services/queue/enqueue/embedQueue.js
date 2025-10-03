// src/services/queue/enqueue/embedQueue.js
// BullMQ queue for embedding generation jobs

const { Queue } = require("bullmq");
const Redis = require("ioredis");
const { randomUUID } = require("crypto");

// Create Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: process.env.REDIS_PORT || 6379,
});

// Create BullMQ queue for embedding jobs
const embedQueue = new Queue("embed-batch", { connection });

/**
 * Enqueue embedding generation job for specific chunk IDs
 * @param {Array<string>} chunkIds - Array of chunk UUIDs to process
 * @param {Object} options - Job options
 * @param {string} options.batchId - Optional batch ID for tracking
 * @param {number} options.priority - Job priority (higher = more important)
 * @returns {Promise<Object>} - Job result
 */
async function enqueueEmbeddingForChunks(chunkIds, options = {}) {
  if (!Array.isArray(chunkIds) || chunkIds.length === 0) {
    throw new Error('enqueueEmbeddingForChunks requires a non-empty array of chunk IDs');
  }

  const batchId = options.batchId || randomUUID();
  const priority = options.priority || 0;

  const jobData = {
    chunkIds,
    batchId,
    timestamp: new Date().toISOString()
  };

  const jobOptions = {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    priority,
    removeOnComplete: 10, // Keep last 10 completed jobs
    removeOnFail: 5,      // Keep last 5 failed jobs
    delay: 0
  };

  try {
    const job = await embedQueue.add('generate-embeddings', jobData, jobOptions);
    console.log(`✅ Enqueued embedding job ${job.id} for ${chunkIds.length} chunks (batch: ${batchId})`);
    
    return {
      jobId: job.id,
      batchId,
      chunkCount: chunkIds.length,
      status: 'queued'
    };
  } catch (error) {
    console.error('Failed to enqueue embedding job:', error.message);
    throw error;
  }
}

/**
 * Enqueue embedding job for all pending chunks of a document
 * @param {string} documentId - Document UUID
 * @param {Object} options - Job options
 * @returns {Promise<Object>} - Job result
 */
async function enqueueEmbeddingForDocument(documentId, options = {}) {
  if (!documentId) {
    throw new Error('enqueueEmbeddingForDocument requires a document ID');
  }

  const batchId = options.batchId || randomUUID();
  const priority = options.priority || 0;

  const jobData = {
    documentId,
    batchId,
    timestamp: new Date().toISOString()
  };

  const jobOptions = {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    priority,
    removeOnComplete: 10,
    removeOnFail: 5,
    delay: 0
  };

  try {
    const job = await embedQueue.add('generate-embeddings-document', jobData, jobOptions);
    console.log(`✅ Enqueued embedding job ${job.id} for document ${documentId} (batch: ${batchId})`);
    
    return {
      jobId: job.id,
      batchId,
      documentId,
      status: 'queued'
    };
  } catch (error) {
    console.error('Failed to enqueue document embedding job:', error.message);
    throw error;
  }
}

/**
 * Get queue statistics
 * @returns {Promise<Object>} - Queue stats
 */
async function getQueueStats() {
  try {
    const waiting = await embedQueue.getWaiting();
    const active = await embedQueue.getActive();
    const completed = await embedQueue.getCompleted();
    const failed = await embedQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    };
  } catch (error) {
    console.error('Failed to get queue stats:', error.message);
    throw error;
  }
}

/**
 * Retry failed embedding jobs
 * @param {number} limit - Maximum number of jobs to retry
 * @returns {Promise<number>} - Number of jobs retried
 */
async function retryFailedJobs(limit = 10) {
  try {
    const failedJobs = await embedQueue.getFailed(0, limit - 1);
    let retriedCount = 0;

    for (const job of failedJobs) {
      try {
        await job.retry();
        retriedCount++;
        console.log(`Retried failed embedding job ${job.id}`);
      } catch (retryError) {
        console.error(`Failed to retry job ${job.id}:`, retryError.message);
      }
    }

    console.log(`Retried ${retriedCount}/${failedJobs.length} failed embedding jobs`);
    return retriedCount;
  } catch (error) {
    console.error('Failed to retry failed jobs:', error.message);
    throw error;
  }
}

/**
 * Clean up old completed/failed jobs
 * @param {Object} options - Cleanup options
 * @param {number} options.completed - Keep this many completed jobs
 * @param {number} options.failed - Keep this many failed jobs
 * @returns {Promise<Object>} - Cleanup results
 */
async function cleanupOldJobs(options = {}) {
  const keepCompleted = options.completed || 10;
  const keepFailed = options.failed || 5;

  try {
    const completed = await embedQueue.getCompleted(keepCompleted, -1);
    const failed = await embedQueue.getFailed(keepFailed, -1);

    let cleanedCompleted = 0;
    let cleanedFailed = 0;

    // Remove old completed jobs
    for (const job of completed) {
      try {
        await job.remove();
        cleanedCompleted++;
      } catch (error) {
        console.error(`Failed to remove completed job ${job.id}:`, error.message);
      }
    }

    // Remove old failed jobs
    for (const job of failed) {
      try {
        await job.remove();
        cleanedFailed++;
      } catch (error) {
        console.error(`Failed to remove failed job ${job.id}:`, error.message);
      }
    }

    console.log(`Cleaned up ${cleanedCompleted} completed and ${cleanedFailed} failed embedding jobs`);
    return {
      cleanedCompleted,
      cleanedFailed,
      total: cleanedCompleted + cleanedFailed
    };
  } catch (error) {
    console.error('Failed to cleanup old jobs:', error.message);
    throw error;
  }
}

module.exports = {
  embedQueue,
  enqueueEmbeddingForChunks,
  enqueueEmbeddingForDocument,
  getQueueStats,
  retryFailedJobs,
  cleanupOldJobs
};
