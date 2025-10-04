// src/routes/uploadRoutes.js
const express = require("express");
const { upload } = require("../middleware/upload.js");
const { handleUpload } = require("../controllers/uploadController.js");
const { ensureAuthenticated } = require("../controllers/authController.js");

const router = express.Router();

/**
 * POST /upload
 * Upload multiple RFP documents (requires authentication)
 */
router.post("/", ensureAuthenticated, upload.array("files", 5), handleUpload);

module.exports = router;
