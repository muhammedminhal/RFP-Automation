// src/models/userModel.js
// Database operations for users table

const pool = require('../config/db/pool');

/**
 * Find user by ID
 * @param {string} id - User UUID
 * @returns {Promise<Object|null>} - User object or null
 */
async function findById(id) {
  const result = await pool.query('SELECT * FROM "users" WHERE id = $1', [id]);
  return result.rows[0] || null;
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} - User object or null
 */
async function findByEmail(email) {
  const result = await pool.query('SELECT * FROM "users" WHERE email = $1', [email]);
  return result.rows[0] || null;
}

/**
 * Create or update user (upsert)
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.name - User name
 * @param {string} userData.provider - Auth provider
 * @param {string} userData.provider_id - Provider user ID
 * @returns {Promise<Object>} - Created/updated user
 */
async function upsertUser({ email, name, provider, provider_id }) {
  const upsertSql = `
    INSERT INTO "users"(email, name, provider, provider_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name,
          provider = EXCLUDED.provider,
          provider_id = EXCLUDED.provider_id
    RETURNING *;
  `;
  const result = await pool.query(upsertSql, [email, name, provider, provider_id]);
  return result.rows[0];
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.name - User name
 * @param {string} userData.provider - Auth provider
 * @param {string} userData.provider_id - Provider user ID
 * @returns {Promise<Object>} - Created user
 */
async function createUser({ email, name, provider, provider_id }) {
  const result = await pool.query(
    `INSERT INTO "users"(email, name, provider, provider_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [email, name, provider, provider_id]
  );
  return result.rows[0];
}

/**
 * Get all users
 * @returns {Promise<Array>} - Array of users
 */
async function getAllUsers() {
  const result = await pool.query('SELECT * FROM "users" ORDER BY created_at DESC');
  return result.rows;
}

module.exports = {
  findById,
  findByEmail,
  upsertUser,
  createUser,
  getAllUsers
};
