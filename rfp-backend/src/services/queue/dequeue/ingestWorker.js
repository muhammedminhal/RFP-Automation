// src/services/queue/dequeue/ingestWorker.js
// Worker process for handling document ingestion using BullMQ

const { Worker } = require("bullmq");
const Redis = require("ioredis");
const { extractText } = require("../../parserService");
const { normalizeText } = require("../../normalizeText");
const { chunkText } = require("../../chunkText");
const { enqueueEmbeddingForChunks } = require("../enqueue/embedQueue");
const { insertChunks } = require("../../../models/chunkModel");

// Connect to Redis
const connection = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: process.env.REDIS_PORT || 6379,
});

// Define a worker that listens on the "ingest" queue
const ingestWorker = new Worker(
  "ingest",
  async (job) => {
    console.log(`Worker started job ${job.id}`);

    const { documentId, filePath } = job.data;

    // Extract plain text from the uploaded file (pdf/docx/xlsx)
    const extractedText = await extractText(filePath);
    // Normalize the extracted text before chunking and embedding
    const clean = normalizeText(extractedText);
    const chunks = chunkText(clean, { maxTokens: 500, overlap: 50 });

    // Prepare chunk data for insertion (add chunk_index, section_title, metadata)
    const chunkData = chunks.map((c, idx) => ({
      document_id: documentId,
      text: c.text,
      token_count: c.tokenCount,
      char_start: c.charStart,
      char_end: c.charEnd,
      chunk_index: idx,
      section_title: c.metadata && c.metadata.section ? c.metadata.section : null,
      metadata: c.metadata || {}
    }));

    // Insert chunks with pending embedding status
    const insertedChunkIds = await insertChunks(chunkData);
    console.log(`Inserted ${chunks.length} chunks for document ${documentId} with pending embedding status`);

    // Enqueue embedding generation job for the new chunks
    if (insertedChunkIds.length > 0) {
      try {
        const embedJob = await enqueueEmbeddingForChunks(insertedChunkIds, {
          priority: 1 // Higher priority for new uploads
        });
        console.log(`Enqueued embedding job ${embedJob.jobId} for ${insertedChunkIds.length} chunks`);
      } catch (embedError) {
        console.error(`Failed to enqueue embedding job for document ${documentId}:`, embedError.message);
        // Don't fail the entire ingestion if embedding enqueue fails
      }
    }

    return { status: "done", documentId };
  },
  { connection }
);

// Log worker events
ingestWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

ingestWorker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

module.exports = ingestWorker;
