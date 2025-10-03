// src/controllers/healthController.js
const pool = require('../config/db/pool');

exports.health = (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
};

exports.dbTest = async (req, res) => {
  try {
    const r = await pool.query('SELECT 1 as ok');
    res.json({ db: r.rows[0] });
  } catch (err) {
    console.error('DB test failed', err);
    res.status(500).json({ error: 'db error', detail: err.message });
  }
};
