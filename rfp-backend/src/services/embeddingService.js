// src/services/embeddingService.js
// Enhanced embedding service with batch processing and @xenova/transformers integration

const config = require('../config');
const crypto = require('crypto');

// Model state
let xenovaAvailable = false;
let xenovaModel = null;
let modelVersion = null;

// Model configuration
const MODEL_CONFIG = {
  name: 'Xenova/all-MiniLM-L6-v2',
  dimension: 384,
  version: '1.0.0'
};

/**
 * Initialize @xenova/transformers model lazily
 */
async function initXenova() {
  if (!config.USE_XENOVA) return;
  if (xenovaAvailable) return;
  
  try {
    const { pipeline } = require('@xenova/transformers');
    console.log(`Loading embedding model: ${MODEL_CONFIG.name}`);
    
    xenovaModel = await pipeline('feature-extraction', MODEL_CONFIG.name);
    xenovaAvailable = true;
    modelVersion = MODEL_CONFIG.version;
    
    console.log(`✅ Xenova model loaded successfully (dim: ${MODEL_CONFIG.dimension})`);
  } catch (err) {
    console.warn(`❌ Failed to load @xenova model: ${err.message}`);
    console.warn('Falling back to deterministic fake embeddings');
    xenovaAvailable = false;
  }
}

/**
 * Generate deterministic fake embedding for development/testing
 * @param {string} text - Input text
 * @returns {Array<number>} - Fake embedding vector
 */
function generateFakeEmbedding(text) {
  const dim = MODEL_CONFIG.dimension;
  const hash = crypto.createHash('md5').update(text).digest('hex');
  
  // Convert hash to deterministic float array
  const embedding = [];
  for (let i = 0; i < dim; i++) {
    const hexPair = hash.substr((i * 2) % 32, 2);
    const val = parseInt(hexPair, 16) / 255.0; // Normalize to 0-1
    embedding.push((val - 0.5) * 2); // Scale to -1 to 1
  }
  
  return embedding;
}

/**
 * Generate single embedding for a text
 * @param {string} text - Input text
 * @returns {Promise<Array<number>>} - Embedding vector
 */
async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('generateEmbedding requires a non-empty string');
  }

  await initXenova();
  
  if (xenovaAvailable && xenovaModel) {
    try {
      const result = await xenovaModel(text);
      // Handle different output formats from @xenova/transformers
      let embedding;
      
      if (Array.isArray(result)) {
        // Direct array output
        embedding = result.flat(Infinity);
      } else if (result.data) {
        // Tensor-like object with data property
        embedding = Array.from(result.data);
      } else if (result.embeddings) {
        // Object with embeddings property
        embedding = result.embeddings.flat(Infinity);
      } else {
        throw new Error('Unexpected model output format');
      }
      
      // Validate dimension
      if (embedding.length !== MODEL_CONFIG.dimension) {
        throw new Error(`Expected dimension ${MODEL_CONFIG.dimension}, got ${embedding.length}`);
      }
      
      return embedding;
    } catch (err) {
      console.error(`Embedding generation failed for text: ${text.substring(0, 100)}...`, err.message);
      throw err;
    }
  }
  
  // Fallback to fake embedding
  return generateFakeEmbedding(text);
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {Array<string>} texts - Array of input texts
 * @param {Object} options - Options for batch processing
 * @param {number} options.batchSize - Number of texts to process at once (default: 32)
 * @param {string} options.modelName - Model name for metadata (default: from config)
 * @returns {Promise<Array<{text: string, embedding: Array<number>, error?: string}>>} - Results array
 */
async function generateEmbeddings(texts, options = {}) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('generateEmbeddings requires a non-empty array of texts');
  }

  const batchSize = options.batchSize || config.EMBED_BATCH_SIZE || 32;
  const modelName = options.modelName || MODEL_CONFIG.name;
  const results = [];

  console.log(`Generating embeddings for ${texts.length} texts (batch size: ${batchSize})`);

  // Process in batches
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (${batch.length} texts)`);

    // Process batch concurrently
    const batchPromises = batch.map(async (text, index) => {
      try {
        const embedding = await generateEmbedding(text);
        return {
          text,
          embedding,
          index: i + index
        };
      } catch (error) {
        console.error(`Failed to generate embedding for text at index ${i + index}:`, error.message);
        return {
          text,
          embedding: null,
          error: error.message,
          index: i + index
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  console.log(`✅ Generated ${results.filter(r => r.embedding).length}/${texts.length} embeddings successfully`);
  return results;
}

/**
 * Get model metadata for database storage
 * @returns {Object} - Model metadata
 */
function getModelMetadata() {
  return {
    modelName: MODEL_CONFIG.name,
    version: modelVersion || MODEL_CONFIG.version,
    dimension: MODEL_CONFIG.dimension,
    useXenova: xenovaAvailable
  };
}

module.exports = {
  generateEmbedding,
  generateEmbeddings,
  getModelMetadata,
  MODEL_CONFIG
};
