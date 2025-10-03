// src/services/parserService.js
// CommonJS parsing service for extracting plain text from PDF, DOCX, and XLSX files.
// - Uses minimal, well-supported npm libs: pdf-parse, mammoth, xlsx
// - Exposes extractText(filePath) which auto-detects the file type and delegates
// - Provides individual helpers: parsePdf, parseDocx, parseXlsx
// - Throws descriptive errors for unsupported types or malformed files

const fs = require('fs');
const path = require('path');

// Lazy-require heavy parsers so cold starts are lighter when not needed
let pdfParse; // pdf-parse
let mammoth;  // mammoth for DOCX
let xlsx;     // xlsx for spreadsheets

/**
 * Extract plain text from a file by inferring its type from extension.
 * @param {string} filePath - Absolute or relative path to the file on disk
 * @returns {Promise<string>} - Extracted text
 */
async function extractText(filePath) {
  assertFileReadable(filePath);

  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf':
      return parsePdf(filePath);
    case '.docx':
      return parseDocx(filePath);
    case '.xlsx':
      return parseXlsx(filePath);
    default:
      throw new Error(`Unsupported file type: ${ext || 'unknown'}. Supported: .pdf, .docx, .xlsx`);
  }
}

/** Ensure the file exists and is readable. Throws if not. */
function assertFileReadable(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('A valid filePath string is required');
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  // fs.accessSync will throw if not readable
  fs.accessSync(filePath, fs.constants.R_OK);
}

/**
 * Parse PDF to text using pdf-parse.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function parsePdf(filePath) {
  try {
    if (!pdfParse) {
      pdfParse = require('pdf-parse');
    }
    const buffer = fs.readFileSync(filePath);
    const result = await pdfParse(buffer);
    // result.text is a string with line breaks
    return result.text || '';
  } catch (err) {
    throw new Error(`Failed to parse PDF (${path.basename(filePath)}): ${err.message}`);
  }
}

/**
 * Parse DOCX to text using mammoth.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function parseDocx(filePath) {
  try {
    if (!mammoth) {
      mammoth = require('mammoth');
    }
    const buffer = fs.readFileSync(filePath);
    const { value } = await mammoth.extractRawText({ buffer });
    return value || '';
  } catch (err) {
    throw new Error(`Failed to parse DOCX (${path.basename(filePath)}): ${err.message}`);
  }
}

/**
 * Parse XLSX to text using xlsx by reading sheets and joining cells.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function parseXlsx(filePath) {
  try {
    if (!xlsx) {
      xlsx = require('xlsx');
    }
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const sheetNames = workbook.SheetNames || [];
    const pieces = [];
    for (const name of sheetNames) {
      const sheet = workbook.Sheets[name];
      if (!sheet) continue;
      // Convert each sheet to CSV-like text for simplicity, then concatenate
      const csv = xlsx.utils.sheet_to_csv(sheet, { blankrows: false });
      if (csv && csv.trim()) {
        pieces.push(`# ${name}\n${csv}`);
      }
    }
    return pieces.join('\n\n');
  } catch (err) {
    throw new Error(`Failed to parse XLSX (${path.basename(filePath)}): ${err.message}`);
  }
}

module.exports = {
  extractText,
  parsePdf,
  parseDocx,
  parseXlsx,
};


