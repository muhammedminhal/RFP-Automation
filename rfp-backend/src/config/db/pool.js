// src/config/db/pool.js
const { Pool } = require('pg');
const config = require('../index');

const pool = new Pool({
  host: config.POSTGRES_HOST,
  port: config.POSTGRES_PORT,
  database: config.POSTGRES_DB,
  user: config.POSTGRES_USER,
  password: config.POSTGRES_PASSWORD
});

module.exports = pool;


