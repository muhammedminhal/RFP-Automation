// src/services/searchService.js
// Hybrid search service: combines FTS (keyword) + Vector (semantic) search with score normalization

const { searchByKeyword, searchByVector } = require('../models/chunkModel');
const { generateEmbedding } = require('./embeddingService');
const { insertSearchLog } = require('../models/searchLogModel');
const config = require('../config');

/**
 * Normalize FTS score (ts_rank_cd) to 0-1 range
 * ts_rank_cd typically returns values 0-1, but can go slightly higher
 * @param {number} score - Raw FTS score
 * @returns {number} - Normalized score 0-1
 */
function normalizeFtsScore(score) {
  if (score == null || isNaN(score)) return 0;
  // Cap at 1.0 and ensure non-negative
  return Math.min(Math.max(score, 0), 1.0);
}

/**
 * Normalize vector similarity score (1 - cosine_distance) to 0-1 range
 * @param {number} score - Raw vector similarity score
 * @returns {number} - Normalized score 0-1
 */
function normalizeVectorScore(score) {
  if (score == null || isNaN(score)) return 0;
  // Already in 0-1 range for cosine similarity
  return Math.min(Math.max(score, 0), 1.0);
}

/**
 * Merge FTS and vector results with weighted hybrid scoring
 * @param {Array} ftsResults - Results from keyword search
 * @param {Array} vectorResults - Results from vector search
 * @param {number} alpha - Weight for vector score (0-1)
 * @returns {Array} - Merged and deduplicated results
 */
function mergeResults(ftsResults, vectorResults, alpha) {
  const resultMap = new Map();

  // Add FTS results
  for (const result of ftsResults) {
    const ftsScore = normalizeFtsScore(parseFloat(result.fts_score));
    resultMap.set(result.id, {
      id: result.id,
      document_id: result.document_id,
      text: result.text,
      chunk_index: result.chunk_index,
      section_title: result.section_title,
      filename: result.filename,
      client_name: result.client_name,
      uploaded_at: result.uploaded_at,
      fts_score: ftsScore,
      vector_score: 0,
      hybrid_score: 0 // Will be calculated after merge
    });
  }

  // Add or update with vector results
  for (const result of vectorResults) {
    const vectorScore = normalizeVectorScore(parseFloat(result.vector_score));
    
    if (resultMap.has(result.id)) {
      // Chunk found in both searches - update vector score
      const existing = resultMap.get(result.id);
      existing.vector_score = vectorScore;
    } else {
      // Chunk only in vector search
      resultMap.set(result.id, {
        id: result.id,
        document_id: result.document_id,
        text: result.text,
        chunk_index: result.chunk_index,
        section_title: result.section_title,
        filename: result.filename,
        client_name: result.client_name,
        uploaded_at: result.uploaded_at,
        fts_score: 0,
        vector_score: vectorScore,
        hybrid_score: 0
      });
    }
  }

  // Calculate hybrid scores: alpha * vector + (1-alpha) * fts
  const mergedResults = Array.from(resultMap.values()).map(item => {
    item.hybrid_score = (alpha * item.vector_score) + ((1 - alpha) * item.fts_score);
    return item;
  });

  // Sort by hybrid score descending
  mergedResults.sort((a, b) => b.hybrid_score - a.hybrid_score);

  return mergedResults;
}

/**
 * Perform hybrid search combining FTS and vector similarity
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query text
 * @param {number} params.topK - Number of top results to return
 * @param {number} params.alpha - Weight for vector score (0-1, default from config)
 * @param {string} params.userId - User ID for logging (optional)
 * @param {string} params.ipAddress - IP address for logging (optional)
 * @returns {Promise<Object>} - Search results with metadata
 */
async function hybridSearch({ query, topK = 10, alpha = null, userId = null, ipAddress = null }) {
  const startTime = Date.now();
  
  // Use config alpha if not provided
  const vectorWeight = alpha !== null ? alpha : config.SEARCH_ALPHA;
  
  // Validate alpha range
  if (vectorWeight < 0 || vectorWeight > 1) {
    throw new Error('Alpha must be between 0 and 1');
  }

  let ftsResults = [];
  let vectorResults = [];
  let queryEmbedding = null;
  let searchType = 'hybrid';
  let errors = [];

  try {
    // Generate embedding for the query
    try {
      queryEmbedding = await generateEmbedding(query);
    } catch (embeddingError) {
      console.warn('Failed to generate query embedding:', embeddingError.message);
      errors.push({ type: 'embedding', message: embeddingError.message });
      searchType = 'keyword'; // Fallback to keyword-only
    }

    // Run searches in parallel if both are available
    const searchPromises = [];

    // FTS search
    searchPromises.push(
      searchByKeyword(query, topK * 2).catch(err => {
        console.error('FTS search failed:', err.message);
        errors.push({ type: 'fts', message: err.message });
        return [];
      })
    );

    // Vector search (only if embedding was generated)
    if (queryEmbedding) {
      searchPromises.push(
        searchByVector(queryEmbedding, topK * 2).catch(err => {
          console.error('Vector search failed:', err.message);
          errors.push({ type: 'vector', message: err.message });
          return [];
        })
      );
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    [ftsResults, vectorResults] = await Promise.all(searchPromises);

    // Determine actual search type based on what succeeded
    if (ftsResults.length === 0 && vectorResults.length === 0) {
      throw new Error('Both FTS and vector search failed');
    } else if (ftsResults.length > 0 && vectorResults.length === 0) {
      searchType = 'keyword';
    } else if (ftsResults.length === 0 && vectorResults.length > 0) {
      searchType = 'semantic';
    } else {
      searchType = 'hybrid';
    }

    // Merge results
    const mergedResults = mergeResults(ftsResults, vectorResults, vectorWeight);

    // Take top K
    const topResults = mergedResults.slice(0, topK);

    const responseTime = Date.now() - startTime;

    // Log search query asynchronously (don't await, don't block response)
    if (insertSearchLog) {
      insertSearchLog({
        user_id: userId,
        query_text: query,
        search_type: searchType,
        filters: { topK, alpha: vectorWeight },
        results_count: topResults.length,
        response_time_ms: responseTime,
        ip_address: ipAddress
      }).catch(err => {
        console.error('Failed to log search:', err.message);
      });
    }

    return {
      query,
      topK,
      alpha: vectorWeight,
      searchType,
      resultsCount: topResults.length,
      responseTimeMs: responseTime,
      results: topResults.map(r => ({
        chunkId: r.id,
        documentId: r.document_id,
        text: r.text,
        chunkIndex: r.chunk_index,
        sectionTitle: r.section_title,
        filename: r.filename,
        clientName: r.client_name,
        uploadedAt: r.uploaded_at,
        scores: {
          hybrid: parseFloat(r.hybrid_score.toFixed(4)),
          fts: parseFloat(r.fts_score.toFixed(4)),
          vector: parseFloat(r.vector_score.toFixed(4))
        }
      })),
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error('Hybrid search error:', error.message);
    throw error;
  }
}

/**
 * Perform keyword-only search (FTS)
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query text
 * @param {number} params.topK - Number of results
 * @returns {Promise<Object>} - Search results
 */
async function keywordSearch({ query, topK = 10 }) {
  const startTime = Date.now();
  
  const results = await searchByKeyword(query, topK);
  const responseTime = Date.now() - startTime;

  return {
    query,
    topK,
    searchType: 'keyword',
    resultsCount: results.length,
    responseTimeMs: responseTime,
    results: results.map(r => ({
      chunkId: r.id,
      documentId: r.document_id,
      text: r.text,
      chunkIndex: r.chunk_index,
      sectionTitle: r.section_title,
      filename: r.filename,
      clientName: r.client_name,
      uploadedAt: r.uploaded_at,
      scores: {
        fts: parseFloat(normalizeFtsScore(parseFloat(r.fts_score)).toFixed(4))
      }
    }))
  };
}

/**
 * Perform semantic-only search (vector)
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query text
 * @param {number} params.topK - Number of results
 * @returns {Promise<Object>} - Search results
 */
async function semanticSearch({ query, topK = 10 }) {
  const startTime = Date.now();
  
  const queryEmbedding = await generateEmbedding(query);
  const results = await searchByVector(queryEmbedding, topK);
  const responseTime = Date.now() - startTime;

  return {
    query,
    topK,
    searchType: 'semantic',
    resultsCount: results.length,
    responseTimeMs: responseTime,
    results: results.map(r => ({
      chunkId: r.id,
      documentId: r.document_id,
      text: r.text,
      chunkIndex: r.chunk_index,
      sectionTitle: r.section_title,
      filename: r.filename,
      clientName: r.client_name,
      uploadedAt: r.uploaded_at,
      scores: {
        vector: parseFloat(normalizeVectorScore(parseFloat(r.vector_score)).toFixed(4))
      }
    }))
  };
}

module.exports = {
  hybridSearch,
  keywordSearch,
  semanticSearch
};

