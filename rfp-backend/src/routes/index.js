// src/routes/index.js
const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const authController = require('../controllers/authController');
const searchRoutes = require('./searchRoutes');

router.get('/health', healthController.health);
router.get('/db-test', healthController.dbTest);

// Auth routes
router.get('/auth/google', authController.authenticateGoogle);
router.get('/auth/google/callback', authController.handleGoogleCallback);
router.get('/auth/success', authController.success);
router.get('/me', authController.ensureAuthenticated, authController.me);

// Search routes (require authentication)
router.use('/search', authController.ensureAuthenticated, searchRoutes);

module.exports = router;
