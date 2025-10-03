// src/services/documentService.js
// Handles saving uploaded documents and enqueuing for processing

const { insertDocument, existsByFilenameAndClient } = require("../models/documentModel");
const { enqueueIngest } = require("./queue/enqueue/ingestJob");

/**
 * Save uploaded documents into DB and enqueue ingestion jobs
 * @param {Array} files - uploaded files from multer
 * @param {string|null} uploaderId - user ID of uploader (nullable for now)
 * @param {string} clientName - name of the client owning these files
 */
async function saveDocuments(files, uploaderId, clientName) {
  const savedDocs = [];

  for (const file of files) {
    // Duplicate check for (filename, client_name)
    const exists = await existsByFilenameAndClient(file.originalname, clientName);
    if (exists) {
      const err = new Error(`Duplicate file for client: ${clientName}, filename: ${file.originalname}`);
      err.status = 409;
      throw err;
    }

    // Insert document metadata into Postgres
    const doc = await insertDocument({
      filename: file.originalname,
      path: file.path,
      uploader_id: uploaderId,
      client_name: clientName,
      file_size: file.size,
      mime_type: file.mimetype,
      status: 'uploaded'
    });

    savedDocs.push(doc);

    // Enqueue ingestion job for this document
    await enqueueIngest({ documentId: doc.id, filePath: doc.path });
  }
  
  return savedDocs;
}

module.exports = { saveDocuments };
