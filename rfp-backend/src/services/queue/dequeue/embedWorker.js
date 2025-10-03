// src/services/queue/dequeue/embedWorker.js
// BullMQ worker for batch embedding generation

const { Worker } = require("bullmq");
const { createRedisConnection } = require("../../../config/redis");
const { generateEmbeddings, getModelMetadata } = require("../../embeddingService");
const { findPendingChunksByIds, findPendingChunksByDocumentId, updateEmbeddingsBatch } = require("../../../models/chunkModel");

// Connect to Redis using shared connection helper
const connection = createRedisConnection();

// Configuration
const BATCH_SIZE = parseInt(process.env.EMBED_BATCH_SIZE) || 32;
const CONCURRENCY = parseInt(process.env.EMBED_WORKER_CONCURRENCY) || 2;

/**
 * Process embedding job for specific chunk IDs
 * @param {Object} job - BullMQ job
 * @returns {Promise<Object>} - Job result
 */
async function processChunkEmbeddingJob(job) {
  const { chunkIds, batchId } = job.data;
  console.log(`Processing embedding job ${job.id} for ${chunkIds.length} chunks (batch: ${batchId})`);

  try {
    // Get pending chunks from database
    const pendingChunks = await findPendingChunksByIds(chunkIds);
    console.log(`Found ${pendingChunks.length}/${chunkIds.length} pending chunks to process`);

    if (pendingChunks.length === 0) {
      console.log(`No pending chunks found for job ${job.id}`);
      return { status: 'completed', processed: 0, message: 'No pending chunks' };
    }

    // Extract texts for embedding generation
    const texts = pendingChunks.map(chunk => chunk.text);
    const modelMetadata = getModelMetadata();

    // Generate embeddings in batches
    const embeddingResults = await generateEmbeddings(texts, {
      batchSize: BATCH_SIZE,
      modelName: modelMetadata.modelName
    });

    // Prepare updates for batch processing
    const updates = pendingChunks.map((chunk, i) => {
      const embeddingResult = embeddingResults[i];
      return {
        chunk_id: chunk.id,
        embedding: embeddingResult.embedding,
        embed_model: modelMetadata.modelName,
        embed_version: modelMetadata.version,
        batch_id: batchId,
        error_message: embeddingResult.error || 'Unknown embedding generation error'
      };
    });

    // Update database with results
    const { successCount, errorCount } = await updateEmbeddingsBatch(updates);
    console.log(`✅ Completed embedding job ${job.id}: ${successCount} success, ${errorCount} errors`);

    return {
      status: 'completed',
      processed: pendingChunks.length,
      success: successCount,
      errors: errorCount,
      batchId
    };

  } catch (error) {
    console.error(`❌ Embedding job ${job.id} failed:`, error.message);
    throw error;
  }
}

/**
 * Process embedding job for all pending chunks of a document
 * @param {Object} job - BullMQ job
 * @returns {Promise<Object>} - Job result
 */
async function processDocumentEmbeddingJob(job) {
  const { documentId, batchId } = job.data;
  console.log(`Processing embedding job ${job.id} for document ${documentId} (batch: ${batchId})`);

  try {
    // Get all pending chunks for the document
    const pendingChunks = await findPendingChunksByDocumentId(documentId);
    console.log(`Found ${pendingChunks.length} pending chunks for document ${documentId}`);

    if (pendingChunks.length === 0) {
      console.log(`No pending chunks found for document ${documentId}`);
      return { status: 'completed', processed: 0, message: 'No pending chunks' };
    }

    // Process in batches to avoid memory issues
    const batchSize = BATCH_SIZE;
    let totalSuccessCount = 0;
    let totalErrorCount = 0;

    for (let i = 0; i < pendingChunks.length; i += batchSize) {
      const batchChunks = pendingChunks.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pendingChunks.length / batchSize)} (${batchChunks.length} chunks)`);

      // Extract texts for this batch
      const texts = batchChunks.map(chunk => chunk.text);
      const modelMetadata = getModelMetadata();

      // Generate embeddings for this batch
      const embeddingResults = await generateEmbeddings(texts, {
        batchSize: Math.min(batchSize, BATCH_SIZE),
        modelName: modelMetadata.modelName
      });

      // Prepare updates for batch processing
      const updates = batchChunks.map((chunk, j) => {
        const embeddingResult = embeddingResults[j];
        return {
          chunk_id: chunk.id,
          embedding: embeddingResult.embedding,
          embed_model: modelMetadata.modelName,
          embed_version: modelMetadata.version,
          batch_id: batchId,
          error_message: embeddingResult.error || 'Unknown embedding generation error'
        };
      });

      // Update database with results
      const { successCount, errorCount } = await updateEmbeddingsBatch(updates);
      totalSuccessCount += successCount;
      totalErrorCount += errorCount;
    }

    console.log(`✅ Completed document embedding job ${job.id}: ${totalSuccessCount} success, ${totalErrorCount} errors`);

    return {
      status: 'completed',
      processed: pendingChunks.length,
      success: totalSuccessCount,
      errors: totalErrorCount,
      documentId,
      batchId
    };

  } catch (error) {
    console.error(`❌ Document embedding job ${job.id} failed:`, error.message);
    throw error;
  }
}

// Create worker with job processors
const embedWorker = new Worker(
  "embed-batch",
  async (job) => {
    console.log(`Embedding worker started job ${job.id} (${job.name})`);

    try {
      if (job.name === 'generate-embeddings') {
        return await processChunkEmbeddingJob(job);
      } else if (job.name === 'generate-embeddings-document') {
        return await processDocumentEmbeddingJob(job);
      } else {
        throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      console.error(`Embedding worker job ${job.id} failed:`, error.message);
      throw error;
    }
  },
  {
    connection,
    concurrency: CONCURRENCY,
    removeOnComplete: 10,
    removeOnFail: 5
  }
);

// Log worker events
embedWorker.on("completed", (job) => {
  console.log(`✅ Embedding job ${job.id} completed successfully`);
});

embedWorker.on("failed", (job, err) => {
  console.error(`❌ Embedding job ${job.id} failed:`, err.message);
});

embedWorker.on("error", (err) => {
  console.error("Embedding worker error:", err.message);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Embedding worker shutting down...');
  await embedWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Embedding worker shutting down...');
  await embedWorker.close();
  process.exit(0);
});

module.exports = embedWorker;
