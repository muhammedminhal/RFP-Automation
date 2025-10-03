// src/models/searchLogModel.js
// Database operations for search_logs table

const pool = require('../config/db/pool');

/**
 * Insert a search log entry
 * @param {Object} logData - Search log data
 * @param {string} logData.user_id - User ID (nullable)
 * @param {string} logData.query_text - Search query
 * @param {string} logData.search_type - Type of search
 * @param {Object} logData.filters - Search filters (JSONB)
 * @param {number} logData.results_count - Number of results returned
 * @param {number} logData.response_time_ms - Response time in ms
 * @param {string} logData.ip_address - IP address (nullable)
 * @returns {Promise<Object>} - Created log entry
 */
async function insertSearchLog({ 
  user_id, 
  query_text, 
  search_type, 
  filters = {}, 
  results_count, 
  response_time_ms, 
  ip_address 
}) {
  try {
    const result = await pool.query(
      `INSERT INTO search_logs (
        user_id, 
        query_text, 
        search_type, 
        filters, 
        results_count, 
        response_time_ms, 
        ip_address
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [user_id, query_text, search_type, filters, results_count, response_time_ms, ip_address]
    );
    return result.rows[0];
  } catch (error) {
    // Don't throw - logging should not break the search flow
    console.error('Failed to insert search log:', error.message);
    return null;
  }
}

/**
 * Get search logs with pagination
 * @param {Object} options - Query options
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.user_id - Filter by user
 * @param {string} options.search_type - Filter by search type
 * @returns {Promise<Array>} - Array of search logs
 */
async function getSearchLogs(options = {}) {
  const { limit = 100, offset = 0, user_id, search_type } = options;
  
  let query = 'SELECT * FROM search_logs';
  const params = [];
  const conditions = [];
  
  if (user_id) {
    conditions.push(`user_id = $${params.length + 1}`);
    params.push(user_id);
  }
  
  if (search_type) {
    conditions.push(`search_type = $${params.length + 1}`);
    params.push(search_type);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get search analytics
 * @param {Object} options - Analytics options
 * @param {Date} options.startDate - Start date for analytics
 * @param {Date} options.endDate - End date for analytics
 * @returns {Promise<Object>} - Search analytics
 */
async function getSearchAnalytics(options = {}) {
  const { startDate, endDate } = options;
  
  let query = `
    SELECT 
      COUNT(*) as total_searches,
      COUNT(DISTINCT user_id) as unique_users,
      AVG(results_count) as avg_results,
      AVG(response_time_ms) as avg_response_time,
      search_type,
      COUNT(*) as count_by_type
    FROM search_logs
  `;
  
  const params = [];
  const conditions = [];
  
  if (startDate) {
    conditions.push(`created_at >= $${params.length + 1}`);
    params.push(startDate);
  }
  
  if (endDate) {
    conditions.push(`created_at <= $${params.length + 1}`);
    params.push(endDate);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' GROUP BY search_type';
  
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get popular search queries
 * @param {number} limit - Number of top queries
 * @returns {Promise<Array>} - Top search queries
 */
async function getPopularQueries(limit = 10) {
  const result = await pool.query(
    `SELECT 
      query_text,
      COUNT(*) as search_count,
      AVG(results_count) as avg_results,
      MAX(created_at) as last_searched
    FROM search_logs
    GROUP BY query_text
    ORDER BY search_count DESC
    LIMIT $1`,
    [limit]
  );
  return result.rows;
}

module.exports = {
  insertSearchLog,
  getSearchLogs,
  getSearchAnalytics,
  getPopularQueries
};

