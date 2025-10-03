// src/services/queue/enqueue/ingestJob.js
// BullMQ job helper for document ingestion

const { Queue } = require("bullmq");
const { createRedisConnection } = require("../../../config/redis");

// Create a Redis connection using shared connection helper
const connection = createRedisConnection();

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
