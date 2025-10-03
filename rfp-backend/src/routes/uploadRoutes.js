// src/routes/uploadRoutes.js
  const express = require("express");
  const { upload } = require("../middleware/upload.js");
  const { handleUpload } = require("../controllers/uploadController.js");

const router = express.Router();

/**
 * POST /upload
 * Upload multiple RFP documents
 */
router.post("/", upload.array("files", 5), handleUpload);

module.exports = router;
