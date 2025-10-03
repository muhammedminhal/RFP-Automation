# Embedding Pipeline Documentation

This document describes the embedding generation pipeline for the RFP Automation System, including setup, configuration, and usage.

## Overview

The embedding pipeline extends the document ingestion flow to generate semantic embeddings for text chunks using @xenova/transformers. The system supports both real embeddings (when `USE_XENOVA=true`) and deterministic fake embeddings for development/testing.

## Architecture

```
Upload → Ingest Worker → Chunk Text → Insert Chunks (status: pending) → Enqueue Embedding Job
                                                                    ↓
Embedding Worker ← Redis Queue ← Embedding Queue ← Chunk IDs
       ↓
Generate Embeddings → Update Database (vector + metadata)
```

## Components

### 1. Database Schema (`003_embeddings.sql`)

The migration adds the following columns to the `chunks` table:

- `embedding_status` (text): 'pending', 'completed', 'failed'
- `embed_model` (text): Model name used for embedding
- `embed_version` (text): Model version
- `embedding_generated_at` (timestamp): When embedding was generated
- `embedding_error` (text): Error message if embedding failed
- `embedding_batch_id` (uuid): Batch identifier for tracking
- `embedding` (vector(384)): Updated to 384 dimensions for all-MiniLM-L6-v2

### 2. Embedding Service (`src/services/embeddingService.js`)

- **Lazy model loading**: @xenova/transformers model loads only when needed
- **Batch processing**: Processes multiple texts efficiently
- **Fallback support**: Deterministic fake embeddings when `USE_XENOVA=false`
- **Error handling**: Graceful degradation on model failures

### 3. Embedding Queue (`src/services/jobs/embedQueue.js`)

- **Job management**: Enqueues embedding jobs for chunks or documents
- **Batch tracking**: Groups related chunks with batch IDs
- **Retry logic**: Automatic retry with exponential backoff
- **Queue statistics**: Monitoring and cleanup utilities

### 4. Embedding Worker (`src/services/workers/embedWorker.js`)

- **Batch processing**: Processes chunks in configurable batches
- **Database transactions**: Ensures data consistency
- **Error isolation**: Individual chunk failures don't stop batch processing
- **Idempotent**: Skips already processed chunks

## Environment Configuration

Add these variables to your `.env` file:

```bash
# Embedding Configuration
USE_XENOVA=true                    # Enable real embeddings (false for fake)
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2  # Model name
EMBEDDING_DIM=384                  # Vector dimension (must match model)
EMBED_BATCH_SIZE=32               # Chunks per batch
EMBED_WORKER_CONCURRENCY=2        # Concurrent workers
```

## Installation

1. **Install dependencies**:
   ```bash
   npm install @xenova/transformers
   ```

2. **Run database migration**:
   ```bash
   docker-compose exec db psql -U rfpuser -d rfpdb -f /docker-entrypoint-initdb.d/migrations/003_embeddings.sql
   ```

3. **Update docker-compose.yml** to include the embedding worker:
   ```yaml
   embed-worker:
     build: .
     container_name: rfp_embed_worker
     depends_on:
       - db
       - redis
     env_file:
       - .env
     environment:
       NODE_ENV: development
     user: "0"
     volumes:
       - ./:/usr/src/app
       - /usr/src/app/node_modules
     command: sh -c "[ -d node_modules ] && [ \"$(ls -A node_modules)\" ] || npm ci && npx nodemon --watch src src/services/workers/embedWorker.js"
     restart: unless-stopped
   ```

## Usage

### Starting the Workers

```bash
# Start all services including embedding worker
docker-compose up -d

# View embedding worker logs
docker-compose logs embed-worker -f

# View queue statistics
docker-compose exec app node -e "
const { getQueueStats } = require('./src/services/jobs/embedQueue');
getQueueStats().then(console.log);
"
```

### Manual Embedding Generation

```javascript
// Enqueue embedding job for specific chunks
const { enqueueEmbeddingForChunks } = require('./src/services/jobs/embedQueue');
await enqueueEmbeddingForChunks(['chunk-id-1', 'chunk-id-2']);

// Enqueue embedding job for all pending chunks in a document
const { enqueueEmbeddingForDocument } = require('./src/services/jobs/embedQueue');
await enqueueEmbeddingForDocument('document-id');
```

### Monitoring Embeddings

```sql
-- Check embedding status
SELECT 
  embedding_status,
  COUNT(*) as count
FROM chunks 
GROUP BY embedding_status;

-- View completed embeddings with metadata
SELECT 
  id,
  embedding_status,
  embed_model,
  embed_version,
  embedding_generated_at,
  embedding[1:5] as sample_vector
FROM chunks 
WHERE embedding_status = 'completed'
LIMIT 5;

-- Check for failed embeddings
SELECT 
  id,
  embedding_error,
  embedding_generated_at
FROM chunks 
WHERE embedding_status = 'failed'
LIMIT 10;
```

## Model Information

### all-MiniLM-L6-v2

- **Dimensions**: 384
- **Model Size**: ~22MB
- **Performance**: Fast, good quality for general text
- **Use Case**: General-purpose semantic search
- **License**: Apache 2.0

### Alternative Models

To use a different model, update the configuration:

```javascript
// In src/services/embeddingService.js
const MODEL_CONFIG = {
  name: 'Xenova/all-mpnet-base-v2',  // 768 dimensions
  dimension: 768,
  version: '1.0.0'
};
```

Remember to update the database migration to match the new dimension.

## Error Handling

### Common Issues

1. **Model Loading Failures**:
   - Check internet connection for model download
   - Verify @xenova/transformers installation
   - Check available memory (models require ~100MB+ RAM)

2. **Dimension Mismatches**:
   - Ensure `EMBEDDING_DIM` matches model dimensions
   - Update database migration if changing models
   - Recreate pgvector index after dimension changes

3. **Memory Issues**:
   - Reduce `EMBED_BATCH_SIZE` for large texts
   - Lower `EMBED_WORKER_CONCURRENCY`
   - Monitor container memory usage

### Retry Failed Embeddings

```javascript
const { retryFailedJobs } = require('./src/services/jobs/embedQueue');
await retryFailedJobs(10); // Retry up to 10 failed jobs
```

## Performance Tuning

### Batch Size Optimization

- **Small batches (8-16)**: Lower memory usage, slower processing
- **Large batches (64-128)**: Higher memory usage, faster processing
- **Default (32)**: Balanced for most use cases

### Concurrency Settings

- **Low concurrency (1-2)**: Stable, lower resource usage
- **High concurrency (4-8)**: Faster processing, higher resource usage
- **Default (2)**: Good balance for most deployments

### Memory Considerations

- Each embedding worker uses ~200-500MB RAM
- Model loading adds ~100MB per worker
- Batch processing scales linearly with batch size

## Search Integration

Once embeddings are generated, you can implement hybrid search:

```sql
-- Vector similarity search
SELECT 
  c.id,
  c.text,
  1 - (c.embedding <=> query_embedding) as similarity
FROM chunks c
WHERE c.embedding_status = 'completed'
ORDER BY c.embedding <=> query_embedding
LIMIT 10;

-- Hybrid search (vector + full-text)
SELECT 
  c.id,
  c.text,
  (1 - (c.embedding <=> query_embedding)) * 0.7 + 
  ts_rank(c.text_search, plainto_tsquery('english', 'search terms')) * 0.3 as score
FROM chunks c
WHERE c.embedding_status = 'completed'
  AND c.text_search @@ plainto_tsquery('english', 'search terms')
ORDER BY score DESC
LIMIT 10;
```

## Troubleshooting

### Check Worker Status

```bash
# View worker logs
docker-compose logs embed-worker

# Check queue status
docker-compose exec redis redis-cli
> KEYS bull:embed-batch:*
> LLEN bull:embed-batch:waiting
> LLEN bull:embed-batch:active
```

### Database Issues

```sql
-- Check for orphaned chunks
SELECT COUNT(*) FROM chunks WHERE embedding_status = 'pending' AND created_at < NOW() - INTERVAL '1 hour';

-- Clean up failed embeddings
UPDATE chunks 
SET embedding_status = 'pending', embedding_error = NULL 
WHERE embedding_status = 'failed' AND embedding_error LIKE '%timeout%';
```

### Model Issues

```bash
# Test model loading
docker-compose exec app node -e "
const { generateEmbedding } = require('./src/services/embeddingService');
generateEmbedding('test text').then(console.log);
"
```

## Future Enhancements

1. **Model Versioning**: Track model versions for embedding compatibility
2. **Embedding Caching**: Cache embeddings for identical text
3. **Custom Models**: Support for fine-tuned models
4. **Embedding Compression**: Reduce storage requirements
5. **Real-time Search**: WebSocket-based search updates
6. **Analytics**: Track embedding generation performance and costs
