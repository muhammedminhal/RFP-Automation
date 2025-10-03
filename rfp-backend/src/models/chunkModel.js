// src/models/chunkModel.js
// Database operations for chunks table

const pool = require('../config/db/pool');

/**
 * Insert a single chunk
 * @param {Object} chunkData - Chunk data
 * @param {string} chunkData.document_id - Document UUID
 * @param {string} chunkData.text - Chunk text
 * @param {number} chunkData.token_count - Token count
 * @param {number} chunkData.char_start - Character start position
 * @param {number} chunkData.char_end - Character end position
 * @param {string} chunkData.embedding_status - Embedding status (default: 'pending')
 * @returns {Promise<Object>} - Created chunk
 */
async function insertChunk({ document_id, text, token_count, char_start, char_end, embedding_status = 'pending' }) {
  const result = await pool.query(
    `INSERT INTO chunks (document_id, text, token_count, char_start, char_end, embedding_status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [document_id, text, token_count, char_start, char_end, embedding_status]
  );
  return result.rows[0];
}

/**
 * Insert multiple chunks in a transaction
 * @param {Array} chunks - Array of chunk data objects
 * @returns {Promise<Array>} - Array of created chunk IDs
 */
async function insertChunks(chunks) {
  const client = await pool.connect();
  const insertedChunkIds = [];

  try {
    await client.query('BEGIN');

    for (const chunk of chunks) {
      const result = await client.query(
        `INSERT INTO chunks (
            document_id,
            text,
            token_count,
            char_start,
            char_end,
            embedding_status,
            chunk_index,
            section_title,
            metadata
         )
         VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8)
         RETURNING id`,
        [
          chunk.document_id,
          chunk.text,
          chunk.token_count,
          chunk.char_start,
          chunk.char_end,
          chunk.chunk_index ?? null,
          chunk.section_title ?? null,
          chunk.metadata ?? {}
        ]
      );
      insertedChunkIds.push(result.rows[0].id);
    }

    await client.query('COMMIT');
    return insertedChunkIds;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Find chunks by document ID
 * @param {string} document_id - Document UUID
 * @returns {Promise<Array>} - Array of chunks
 */
async function findByDocumentId(document_id) {
  const result = await pool.query(
    'SELECT * FROM chunks WHERE document_id = $1 ORDER BY char_start ASC',
    [document_id]
  );
  return result.rows;
}

/**
 * Find pending chunks by chunk IDs
 * @param {Array<string>} chunk_ids - Array of chunk UUIDs
 * @returns {Promise<Array>} - Array of pending chunks
 */
async function findPendingChunksByIds(chunk_ids) {
  const result = await pool.query(
    `SELECT id, text, embedding_status 
     FROM chunks 
     WHERE id = ANY($1) AND embedding_status = 'pending'
     ORDER BY created_at ASC`,
    [chunk_ids]
  );
  return result.rows;
}

/**
 * Find pending chunks by document ID
 * @param {string} document_id - Document UUID
 * @returns {Promise<Array>} - Array of pending chunks
 */
async function findPendingChunksByDocumentId(document_id) {
  const result = await pool.query(
    `SELECT id, text, embedding_status 
     FROM chunks 
     WHERE document_id = $1 AND embedding_status = 'pending'
     ORDER BY created_at ASC`,
    [document_id]
  );
  return result.rows;
}

/**
 * Update chunk embedding with success
 * @param {string} chunk_id - Chunk UUID
 * @param {Array<number>} embedding - Embedding vector
 * @param {string} embed_model - Model name
 * @param {string} embed_version - Model version
 * @param {string} batch_id - Batch ID
 * @returns {Promise<boolean>} - True if updated
 */
async function updateEmbeddingSuccess(chunk_id, embedding, embed_model, embed_version, batch_id) {
  const embeddingLiteral = `[${embedding.join(",")}]`;
  const result = await pool.query(
    `UPDATE chunks 
     SET embedding = $1::vector,
         embedding_status = 'completed',
         embed_model = $2,
         embed_version = $3,
         embedding_generated_at = NOW(),
         embedding_batch_id = $4,
         embedding_error = NULL
     WHERE id = $5`,
    [embeddingLiteral, embed_model, embed_version, batch_id, chunk_id]
  );
  return result.rowCount > 0;
}

/**
 * Update chunk embedding with failure
 * @param {string} chunk_id - Chunk UUID
 * @param {string} error_message - Error message
 * @param {string} batch_id - Batch ID
 * @returns {Promise<boolean>} - True if updated
 */
async function updateEmbeddingFailure(chunk_id, error_message, batch_id) {
  const result = await pool.query(
    `UPDATE chunks 
     SET embedding_status = 'failed',
         embedding_error = $1,
         embedding_batch_id = $2
     WHERE id = $3`,
    [error_message, batch_id, chunk_id]
  );
  return result.rowCount > 0;
}

/**
 * Update multiple chunk embeddings in a transaction
 * @param {Array} updates - Array of update objects
 * @returns {Promise<Object>} - Update results
 */
async function updateEmbeddingsBatch(updates) {
  const client = await pool.connect();
  let successCount = 0;
  let errorCount = 0;

  try {
    await client.query('BEGIN');

    for (const update of updates) {
      const { chunk_id, embedding, embed_model, embed_version, batch_id, error_message } = update;

      if (embedding) {
        // Success case
        const embeddingLiteral = `[${embedding.join(",")}]`;
        await client.query(
          `UPDATE chunks 
           SET embedding = $1::vector,
               embedding_status = 'completed',
               embed_model = $2,
               embed_version = $3,
               embedding_generated_at = NOW(),
               embedding_batch_id = $4,
               embedding_error = NULL
           WHERE id = $5`,
          [embeddingLiteral, embed_model, embed_version, batch_id, chunk_id]
        );
        successCount++;
      } else {
        // Failure case
        await client.query(
          `UPDATE chunks 
           SET embedding_status = 'failed',
               embedding_error = $1,
               embedding_batch_id = $2
           WHERE id = $3`,
          [error_message, batch_id, chunk_id]
        );
        errorCount++;
      }
    }

    await client.query('COMMIT');
    return { successCount, errorCount };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get chunk by ID
 * @param {string} id - Chunk UUID
 * @returns {Promise<Object|null>} - Chunk object or null
 */
async function findById(id) {
  const result = await pool.query(
    'SELECT * FROM chunks WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Get all chunks with pagination
 * @param {Object} options - Query options
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.embedding_status - Filter by embedding status
 * @returns {Promise<Array>} - Array of chunks
 */
async function getAllChunks(options = {}) {
  const { limit = 100, offset = 0, embedding_status } = options;
  
  let query = 'SELECT * FROM chunks';
  const params = [];
  
  if (embedding_status) {
    query += ' WHERE embedding_status = $1';
    params.push(embedding_status);
  }
  
  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Delete chunks by document ID
 * @param {string} document_id - Document UUID
 * @returns {Promise<number>} - Number of deleted chunks
 */
async function deleteByDocumentId(document_id) {
  const result = await pool.query(
    'DELETE FROM chunks WHERE document_id = $1',
    [document_id]
  );
  return result.rowCount;
}

/**
 * Get chunk statistics
 * @returns {Promise<Object>} - Chunk statistics
 */
async function getStatistics() {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_chunks,
      COUNT(CASE WHEN embedding_status = 'completed' THEN 1 END) as completed_embeddings,
      COUNT(CASE WHEN embedding_status = 'pending' THEN 1 END) as pending_embeddings,
      COUNT(CASE WHEN embedding_status = 'failed' THEN 1 END) as failed_embeddings
    FROM chunks
  `);
  return result.rows[0];
}

/**
 * Full-Text Search on chunks using ts_rank_cd
 * @param {string} query - Search query text
 * @param {number} limit - Max results to return
 * @returns {Promise<Array>} - Array of chunks with FTS scores
 */
async function searchByKeyword(query, limit = 20) {
  const result = await pool.query(
    `SELECT 
       c.id, 
       c.document_id, 
       c.text,
       c.chunk_index,
       c.section_title,
       ts_rank_cd(c.text_search, plainto_tsquery('english', $1)) AS fts_score,
       d.filename,
       d.client_name,
       d.uploaded_at
     FROM chunks c
     INNER JOIN documents d ON c.document_id = d.id
     WHERE c.text_search @@ plainto_tsquery('english', $1)
       AND c.embedding_status = 'completed'
       AND d.deleted_at IS NULL
     ORDER BY fts_score DESC
     LIMIT $2`,
    [query, limit]
  );
  return result.rows;
}

/**
 * Vector similarity search on chunks
 * @param {Array<number>} embedding - Query embedding vector
 * @param {number} limit - Max results to return
 * @returns {Promise<Array>} - Array of chunks with similarity scores
 */
async function searchByVector(embedding, limit = 20) {
  const embeddingLiteral = `[${embedding.join(",")}]`;
  const result = await pool.query(
    `SELECT 
       c.id, 
       c.document_id, 
       c.text,
       c.chunk_index,
       c.section_title,
       1 - (c.embedding <=> $1::vector) AS vector_score,
       d.filename,
       d.client_name,
       d.uploaded_at
     FROM chunks c
     INNER JOIN documents d ON c.document_id = d.id
     WHERE c.embedding IS NOT NULL
       AND c.embedding_status = 'completed'
       AND d.deleted_at IS NULL
     ORDER BY c.embedding <=> $1::vector ASC
     LIMIT $2`,
    [embeddingLiteral, limit]
  );
  return result.rows;
}

module.exports = {
  insertChunk,
  insertChunks,
  findByDocumentId,
  findPendingChunksByIds,
  findPendingChunksByDocumentId,
  updateEmbeddingSuccess,
  updateEmbeddingFailure,
  updateEmbeddingsBatch,
  findById,
  getAllChunks,
  deleteByDocumentId,
  getStatistics,
  searchByKeyword,
  searchByVector
};
