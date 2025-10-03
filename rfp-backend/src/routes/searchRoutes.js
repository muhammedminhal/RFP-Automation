// src/routes/searchRoutes.js
// Search API routes

const express = require("express");
const { handleSearch, getSearchStats } = require("../controllers/searchController");

const router = express.Router();

/**
 * GET /search?q=...&topK=10&alpha=0.6&type=hybrid
 * Main search endpoint
 * 
 * Query params:
 * - q: Search query (required, 2-500 chars)
 * - topK: Number of results (optional, default 10, max 100)
 * - alpha: Vector weight 0-1 (optional, default from config)
 * - type: 'hybrid' | 'keyword' | 'semantic' (optional, default 'hybrid')
 */
router.get("/", handleSearch);

/**
 * GET /search/stats
 * Search analytics and statistics
 */
router.get("/stats", getSearchStats);

module.exports = router;

