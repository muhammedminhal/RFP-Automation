// src/models/documentModel.js
// Database operations for documents table

const pool = require('../config/db/pool');

/**
 * Insert a new document
 * @param {Object} documentData - Document data
 * @param {string} documentData.filename - Document filename
 * @param {string} documentData.path - Document file path
 * @param {string|null} documentData.uploader_id - Uploader user ID
 * @param {string} documentData.client_name - Client name
 * @returns {Promise<Object>} - Created document
 */
async function insertDocument({ filename, path, uploader_id, client_name, file_size, mime_type, status }) {
  const result = await pool.query(
    `INSERT INTO documents (filename, path, uploader_id, client_name, file_size, mime_type, status)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'uploaded'))
     RETURNING id, filename, client_name, path, uploader_id, uploaded_at, file_size, mime_type, status`,
    [filename, path, uploader_id, client_name, file_size || null, mime_type || null, status || null]
  );
  return result.rows[0];
}

/**
 * Find document by ID
 * @param {string} id - Document UUID
 * @returns {Promise<Object|null>} - Document object or null
 */
async function findById(id) {
  const result = await pool.query(
    'SELECT * FROM documents WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Check if document exists by filename and client name
 * @param {string} filename - Document filename
 * @param {string} client_name - Client name
 * @returns {Promise<boolean>} - True if document exists
 */
async function existsByFilenameAndClient(filename, client_name) {
  const result = await pool.query(
    'SELECT 1 FROM documents WHERE filename = $1 AND client_name = $2 LIMIT 1',
    [filename, client_name]
  );
  return result.rowCount > 0;
}

/**
 * Get all documents
 * @param {Object} options - Query options
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.client_name - Filter by client name
 * @returns {Promise<Array>} - Array of documents
 */
async function getAllDocuments(options = {}) {
  const { limit = 100, offset = 0, client_name } = options;
  
  let query = 'SELECT * FROM documents';
  const params = [];
  
  if (client_name) {
    query += ' WHERE client_name = $1';
    params.push(client_name);
  }
  
  query += ' ORDER BY uploaded_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get documents by uploader ID
 * @param {string} uploader_id - Uploader user ID
 * @returns {Promise<Array>} - Array of documents
 */
async function getByUploaderId(uploader_id) {
  const result = await pool.query(
    'SELECT * FROM documents WHERE uploader_id = $1 ORDER BY uploaded_at DESC',
    [uploader_id]
  );
  return result.rows;
}

/**
 * Get documents by client name
 * @param {string} client_name - Client name
 * @returns {Promise<Array>} - Array of documents
 */
async function getByClientName(client_name) {
  const result = await pool.query(
    'SELECT * FROM documents WHERE client_name = $1 ORDER BY uploaded_at DESC',
    [client_name]
  );
  return result.rows;
}

/**
 * Delete document by ID
 * @param {string} id - Document UUID
 * @returns {Promise<boolean>} - True if deleted
 */
async function deleteById(id) {
  const result = await pool.query(
    'DELETE FROM documents WHERE id = $1',
    [id]
  );
  return result.rowCount > 0;
}

/**
 * Update document
 * @param {string} id - Document UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} - Updated document or null
 */
async function updateById(id, updates) {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  
  const result = await pool.query(
    `UPDATE documents SET ${setClause} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] || null;
}

module.exports = {
  insertDocument,
  findById,
  existsByFilenameAndClient,
  getAllDocuments,
  getByUploaderId,
  getByClientName,
  deleteById,
  updateById
};
