  // src/middleware/upload.js
  const multer = require("multer");
  const path = require("path");
  const fs = require("fs");

// Base uploads directory
const baseUploadDir = path.join(process.cwd(), "public/uploads");
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Get clientName from req (set by controller middleware)
    const clientName = req.clientName || "default";
    const clientDir = path.join(baseUploadDir, clientName);
    try {
      if (!fs.existsSync(clientDir)) {
        fs.mkdirSync(clientDir, { recursive: true });
      }
      cb(null, clientDir); // save files to /public/uploads/<clientName>
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique file name: timestamp-originalname
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// File filter to accept only pdf, docx, xlsx
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",       // .xlsx
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOCX, and XLSX files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
});

module.exports = { upload };
