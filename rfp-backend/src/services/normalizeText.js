// src/utils/normalizeText.js
// Text normalization utility for cleaning extracted document text before chunking and embedding

/**
 * Normalizes text extracted from documents to prepare it for chunking and embedding.
 * Performs various cleaning operations to ensure consistent, clean text.
 * 
 * @param {string} text - Raw text extracted from document
 * @returns {string} - Normalized and cleaned text
 * @throws {Error} - If input is not a string
 */
function normalizeText(text) {
    // Input validation
    if (typeof text !== 'string') {
      throw new Error('normalizeText expects a string input');
    }
  
    let normalized = text;
  
    // Step 1: Remove control/non-printable characters (keep only printable ASCII + common Unicode)
    // This removes null bytes, control characters, but preserves spaces, tabs, newlines
    normalized = normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
    // Step 2: Normalize quotes (curly quotes → straight quotes)
    // Left and right single quotes
    normalized = normalized.replace(/['']/g, "'");
    // Left and right double quotes
    normalized = normalized.replace(/[""]/g, '"');
  
    // Step 3: Normalize dashes (em dash, en dash → simple hyphen)
    // Em dash (—) and en dash (–) → regular hyphen (-)
    normalized = normalized.replace(/[—–]/g, '-');
  
    // Step 4: Remove common page headers/footers
    // Page numbers: "Page X of Y", "Page X", "X of Y"
    normalized = normalized.replace(/^Page\s+\d+\s+of\s+\d+$/gm, '');
    normalized = normalized.replace(/^Page\s+\d+$/gm, '');
    normalized = normalized.replace(/^\d+\s+of\s+\d+$/gm, '');
    
    // Confidential markings
    normalized = normalized.replace(/^(CONFIDENTIAL|Confidential|confidential).*$/gm, '');
    
    // Common footer patterns
    normalized = normalized.replace(/^©.*$/gm, '');
    normalized = normalized.replace(/^Copyright.*$/gm, '');
  
    // Step 5: Collapse multiple whitespace characters into single spaces
    // This handles multiple spaces, tabs, and other whitespace
    normalized = normalized.replace(/[ \t]+/g, ' ');
  
    // Step 6: Normalize line breaks
    // Convert different line break types to standard \n
    normalized = normalized.replace(/\r\n/g, '\n'); // Windows CRLF → LF
    normalized = normalized.replace(/\r/g, '\n');   // Mac CR → LF
    
    // Collapse multiple consecutive newlines into single newline
    normalized = normalized.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
  
    // Step 7: Remove lines that are only whitespace
    normalized = normalized.replace(/^\s*$/gm, '');
  
    // Step 8: Final trim of leading/trailing whitespace
    normalized = normalized.trim();
  
    // Step 9: Ensure we don't return empty string (fallback to original if everything was removed)
    if (normalized.length === 0) {
      console.warn('normalizeText: All text was removed during normalization, returning original');
      return text.trim();
    }
  
    return normalized;
  }
  
  module.exports = { normalizeText };