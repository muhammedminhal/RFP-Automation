// src/services/chunkText.js
// Rule-based chunking with heading/Q&A detection, adaptive splitting, and token overlap

const { randomUUID } = require('crypto');

/**
 * Approximate token count (whitespace-based).
 */
function countTokens(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Split text into logical segments using:
 * - Headings: 1.2.3 Title (^\d+(\.\d+)*\s+)
 * - Q/A markers: /^Question:/i or /^Answer:/i
 * - Paragraphs: split on double newlines
 */
function splitIntoSegments(text) {
  const lines = text.split('\n');
  const segments = [];
  let current = [];

  const isHeading = (line) => /^\d+(\.\d+)*\s+/.test(line);
  const isQAStart = (line) => /^(Question:|Answer:)/i.test(line);

  const pushCurrent = () => {
    if (current.length > 0) {
      segments.push(current.join('\n'));
      current = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // New paragraph boundary
    if (line.trim() === '') {
      // paragraph end if we already have content
      if (current.length > 0) {
        current.push(''); // keep one newline between paragraphs inside a segment
      }
      continue;
    }

    // If encountering a heading or Q/A marker, start a new segment
    if (isHeading(line) || isQAStart(line)) {
      pushCurrent();
      current.push(line);
    } else {
      current.push(line);
    }
  }
  pushCurrent();

  // Also split any overly large blocks by double newlines as candidate sub-segments
  const expanded = [];
  for (const seg of segments) {
    const parts = seg.split(/\n{2,}/);
    for (const p of parts) {
      const trimmed = p.trim();
      if (trimmed) expanded.push(trimmed);
    }
  }
  return expanded;
}

/**
 * Further split a long segment into chunks of ~maxTokens with overlap.
 */
function splitWithOverlap(text, maxTokens, overlap) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  if (words.length === 0) return chunks;

  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + maxTokens, words.length);
    const piece = words.slice(start, end).join(' ');
    const charStart = text.indexOf(piece); // approximate; okay for our case
    const charEnd = charStart + piece.length;
    chunks.push({ text: piece, tokenCount: end - start, charStart, charEnd });

    if (end === words.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
}

/**
 * Enrich metadata based on content.
 */
function deriveMetadata(chunkText) {
  const meta = {
    section: null,
    isQuestion: false,
    isAnswer: false,
  };

  const firstLine = (chunkText.split('\n')[0] || '').trim();

  const headingMatch = firstLine.match(/^(\d+(?:\.\d+)*)\s+(.+)/);
  if (headingMatch) {
    meta.section = `${headingMatch[1]} ${headingMatch[2]}`;
  }

  if (/^Question:/i.test(firstLine)) meta.isQuestion = true;
  if (/^Answer:/i.test(firstLine)) meta.isAnswer = true;

  return meta;
}

/**
 * chunkText
 * - text: normalized string
 * - options: { maxTokens = 500, overlap = 50 }
 * Returns: array of chunks [{ id, text, tokenCount, charStart, charEnd, metadata }]
 */
function chunkText(text, options = {}) {
  if (typeof text !== 'string') throw new Error('chunkText expects a string input');

  const maxTokens = Number.isFinite(options.maxTokens) ? options.maxTokens : 500;
  const overlap = Number.isFinite(options.overlap) ? options.overlap : 50;

  // 1) Split into candidate segments
  const segments = splitIntoSegments(text);

  const results = [];
  let cursor = 0; // track approximate char positions across the whole text

  for (const seg of segments) {
    const segTokenCount = countTokens(seg);

    if (segTokenCount <= maxTokens && segTokenCount >= 50) {
      // Accept as-is
      const start = text.indexOf(seg, cursor);
      const end = start >= 0 ? start + seg.length : cursor + seg.length;
      const metadata = deriveMetadata(seg);

      results.push({
        id: randomUUID(),
        text: seg,
        tokenCount: segTokenCount,
        charStart: start >= 0 ? start : cursor,
        charEnd: end,
        metadata,
      });

      cursor = end;
      continue;
    }

    if (segTokenCount < 50) {
      // Too small, still include to avoid losing content
      const start = text.indexOf(seg, cursor);
      const end = start >= 0 ? start + seg.length : cursor + seg.length;
      const metadata = deriveMetadata(seg);

      results.push({
        id: randomUUID(),
        text: seg,
        tokenCount: segTokenCount,
        charStart: start >= 0 ? start : cursor,
        charEnd: end,
        metadata,
      });

      cursor = end;
      continue;
    }

    // 2) Adaptive split with overlap for long segments
    const pieces = splitWithOverlap(seg, maxTokens, overlap);
    for (const p of pieces) {
      const metadata = deriveMetadata(p.text);
      results.push({
        id: randomUUID(),
        text: p.text,
        tokenCount: p.tokenCount,
        charStart: p.charStart,
        charEnd: p.charEnd,
        metadata,
      });
    }

    // Bump cursor approximately
    const segIndex = text.indexOf(seg, cursor);
    if (segIndex >= 0) cursor = segIndex + seg.length;
    else cursor += seg.length;
  }

  return results;
}

module.exports = { chunkText };