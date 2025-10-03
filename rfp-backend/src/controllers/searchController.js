// src/controllers/searchController.js
// Search controller with input validation and sanitization

const { hybridSearch, keywordSearch, semanticSearch } = require('../services/searchService');

/**
 * Validate and sanitize search query
 * @param {string} query - Raw query string
 * @returns {string} - Sanitized query
 * @throws {Error} - If query is invalid
 */
function validateAndSanitizeQuery(query) {
  // Check if query exists
  if (!query || typeof query !== 'string') {
    throw new Error('Query parameter "q" is required and must be a string');
  }

  // Trim whitespace
  const sanitized = query.trim();

  // Check minimum length
  if (sanitized.length < 2) {
    throw new Error('Query must be at least 2 characters long');
  }

  // Check maximum length
  if (sanitized.length > 500) {
    throw new Error('Query must not exceed 500 characters');
  }

  // Remove potential SQL injection attempts (basic sanitization)
  // PostgreSQL's plainto_tsquery and parameterized queries handle most of this,
  // but we can filter obvious malicious patterns
  const dangerous = /(\-\-|;|\/\*|\*\/|xp_|sp_|exec|execute|drop|delete|truncate|alter)/gi;
  if (dangerous.test(sanitized)) {
    throw new Error('Query contains invalid characters or patterns');
  }

  return sanitized;
}

/**
 * Validate topK parameter
 * @param {any} topK - Raw topK value
 * @returns {number} - Validated topK
 */
function validateTopK(topK) {
  const defaultTopK = 10;
  const maxTopK = 100;

  if (!topK) return defaultTopK;

  const parsed = parseInt(topK, 10);
  
  if (isNaN(parsed) || parsed < 1) {
    throw new Error('topK must be a positive integer');
  }

  if (parsed > maxTopK) {
    throw new Error(`topK must not exceed ${maxTopK}`);
  }

  return parsed;
}

/**
 * Validate alpha parameter (vector weight)
 * @param {any} alpha - Raw alpha value
 * @returns {number|null} - Validated alpha or null for default
 */
function validateAlpha(alpha) {
  if (!alpha) return null; // Use config default

  const parsed = parseFloat(alpha);

  if (isNaN(parsed)) {
    throw new Error('alpha must be a number between 0 and 1');
  }

  if (parsed < 0 || parsed > 1) {
    throw new Error('alpha must be between 0 and 1');
  }

  return parsed;
}

/**
 * GET /search?q=...&topK=10&alpha=0.6&type=hybrid
 * Main search endpoint with hybrid/keyword/semantic modes
 */
async function handleSearch(req, res) {
  try {
    // Extract and validate parameters
    const rawQuery = req.query.q;
    const rawTopK = req.query.topK || req.query.topk || req.query.limit;
    const rawAlpha = req.query.alpha;
    const searchTypeParam = req.query.type || 'hybrid';

    // Validate and sanitize
    const query = validateAndSanitizeQuery(rawQuery);
    const topK = validateTopK(rawTopK);
    const alpha = validateAlpha(rawAlpha);

    // Get user info for logging
    const userId = req.user?.id || null;
    const ipAddress = req.ip || req.connection.remoteAddress || null;

    let searchResult;

    // Route to appropriate search function
    switch (searchTypeParam.toLowerCase()) {
      case 'keyword':
      case 'fts':
        searchResult = await keywordSearch({ query, topK });
        break;

      case 'semantic':
      case 'vector':
        searchResult = await semanticSearch({ query, topK });
        break;

      case 'hybrid':
      default:
        searchResult = await hybridSearch({ 
          query, 
          topK, 
          alpha, 
          userId, 
          ipAddress 
        });
        break;
    }

    return res.status(200).json({
      success: true,
      ...searchResult
    });

  } catch (error) {
    console.error('Search error:', error.message);

    // Handle validation errors (400)
    if (error.message.includes('required') || 
        error.message.includes('must be') || 
        error.message.includes('invalid')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Handle other errors (500)
    return res.status(500).json({
      success: false,
      error: 'Search failed',
      detail: error.message
    });
  }
}

/**
 * GET /search/stats
 * Get search statistics (for analytics)
 */
async function getSearchStats(req, res) {
  try {
    // This could query search_logs for analytics
    // For now, return a placeholder
    return res.status(200).json({
      success: true,
      message: 'Search statistics endpoint - to be implemented'
    });
  } catch (error) {
    console.error('Search stats error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve search statistics'
    });
  }
}

module.exports = {
  handleSearch,
  getSearchStats
};

