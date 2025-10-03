// src/models/qaPairModel.js
// Database operations for qa_pairs table

const pool = require('../config/db/pool');

/**
 * Insert a new Q&A pair
 * @param {Object} qaData - Q&A data
 * @param {string} qaData.question - Question text
 * @param {string} qaData.answer - Answer text
 * @param {string} qaData.source_chunk_id - Source chunk UUID
 * @param {string} qaData.curated_by - Curator user UUID
 * @param {string} qaData.status - Status (default: 'draft')
 * @returns {Promise<Object>} - Created Q&A pair
 */
async function insertQAPair({ question, answer, source_chunk_id, curated_by, status = 'draft' }) {
  const result = await pool.query(
    `INSERT INTO qa_pairs (question, answer, source_chunk_id, curated_by, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [question, answer, source_chunk_id, curated_by, status]
  );
  return result.rows[0];
}

/**
 * Find Q&A pair by ID
 * @param {string} id - Q&A pair UUID
 * @returns {Promise<Object|null>} - Q&A pair object or null
 */
async function findById(id) {
  const result = await pool.query(
    'SELECT * FROM qa_pairs WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Get all Q&A pairs with pagination
 * @param {Object} options - Query options
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.status - Filter by status
 * @param {string} options.curated_by - Filter by curator
 * @returns {Promise<Array>} - Array of Q&A pairs
 */
async function getAllQAPairs(options = {}) {
  const { limit = 100, offset = 0, status, curated_by } = options;
  
  let query = 'SELECT * FROM qa_pairs';
  const params = [];
  const conditions = [];
  
  if (status) {
    conditions.push(`status = $${params.length + 1}`);
    params.push(status);
  }
  
  if (curated_by) {
    conditions.push(`curated_by = $${params.length + 1}`);
    params.push(curated_by);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get Q&A pairs by source chunk ID
 * @param {string} source_chunk_id - Source chunk UUID
 * @returns {Promise<Array>} - Array of Q&A pairs
 */
async function getBySourceChunkId(source_chunk_id) {
  const result = await pool.query(
    'SELECT * FROM qa_pairs WHERE source_chunk_id = $1 ORDER BY created_at DESC',
    [source_chunk_id]
  );
  return result.rows;
}

/**
 * Get Q&A pairs by curator
 * @param {string} curated_by - Curator user UUID
 * @returns {Promise<Array>} - Array of Q&A pairs
 */
async function getByCurator(curated_by) {
  const result = await pool.query(
    'SELECT * FROM qa_pairs WHERE curated_by = $1 ORDER BY created_at DESC',
    [curated_by]
  );
  return result.rows;
}

/**
 * Get Q&A pairs by status
 * @param {string} status - Status filter
 * @returns {Promise<Array>} - Array of Q&A pairs
 */
async function getByStatus(status) {
  const result = await pool.query(
    'SELECT * FROM qa_pairs WHERE status = $1 ORDER BY created_at DESC',
    [status]
  );
  return result.rows;
}

/**
 * Update Q&A pair
 * @param {string} id - Q&A pair UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} - Updated Q&A pair or null
 */
async function updateById(id, updates) {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  
  const result = await pool.query(
    `UPDATE qa_pairs SET ${setClause} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] || null;
}

/**
 * Delete Q&A pair by ID
 * @param {string} id - Q&A pair UUID
 * @returns {Promise<boolean>} - True if deleted
 */
async function deleteById(id) {
  const result = await pool.query(
    'DELETE FROM qa_pairs WHERE id = $1',
    [id]
  );
  return result.rowCount > 0;
}

/**
 * Search Q&A pairs by question text
 * @param {string} searchText - Search text
 * @param {Object} options - Search options
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise<Array>} - Array of matching Q&A pairs
 */
async function searchByQuestion(searchText, options = {}) {
  const { limit = 100, offset = 0 } = options;
  
  const result = await pool.query(
    `SELECT * FROM qa_pairs 
     WHERE question ILIKE $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [`%${searchText}%`, limit, offset]
  );
  return result.rows;
}

/**
 * Get Q&A pair statistics
 * @returns {Promise<Object>} - Q&A pair statistics
 */
async function getStatistics() {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_qa_pairs,
      COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_pairs,
      COUNT(CASE WHEN status = 'published' THEN 1 END) as published_pairs,
      COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_pairs
    FROM qa_pairs
  `);
  return result.rows[0];
}

module.exports = {
  insertQAPair,
  findById,
  getAllQAPairs,
  getBySourceChunkId,
  getByCurator,
  getByStatus,
  updateById,
  deleteById,
  searchByQuestion,
  getStatistics
};
