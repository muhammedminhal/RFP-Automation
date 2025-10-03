// src/services/queue/enqueue/ingestJob.js
// BullMQ job helper for document ingestion

const { Queue } = require("bullmq");
const Redis = require("ioredis");

// Create a Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: process.env.REDIS_PORT || 6379,
});

// Create a BullMQ queue named "ingest"
const ingestQueue = new Queue("ingest", { connection });

/**
 * Enqueue a document ingestion job
 * @param {Object} payload - { documentId, filePath }
 */
async function enqueueIngest(payload) {
  await ingestQueue.add("ingest-document", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
  console.log(`Enqueued job for document: ${payload.documentId}`);
}

module.exports = { ingestQueue, enqueueIngest };
