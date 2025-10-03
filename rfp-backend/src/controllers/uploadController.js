 // src/controllers/uploadController.js
const { saveDocuments } = require("../services/documentService");
 
 async function handleUpload(req, res) {
   try {
     const clientName = req.body && req.body.clientName;
     if (!clientName || typeof clientName !== 'string' || !clientName.trim()) {
       return res.status(400).json({ error: "clientName is required" });
     }
     if (!req.files || req.files.length === 0) {
       return res.status(400).json({ error: "No files uploaded" });
     }

     // Set clientName on req for multer to use
     req.clientName = clientName.trim();
     const uploaderId = req.user?.id || null;

     const savedDocs = await saveDocuments(req.files, uploaderId, clientName.trim());
 
     return res.status(201).json({
       message: "Files uploaded successfully",
       documents: savedDocs,
     });
   } catch (err) {
     console.error("Upload error:", err);
     return res.status(500).json({ error: "Failed to upload files" });
   }
 }
 
 module.exports = { handleUpload };
 
