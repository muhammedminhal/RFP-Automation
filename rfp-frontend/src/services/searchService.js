// src/services/searchService.js
import AuthService from './authService';
import { END_POINTS } from './endPoints';

/**
 * Search Service for handling document searches
 */
class SearchService {
  /**
   * Search documents using the hybrid search API
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.query - Search query
   * @param {number} searchParams.topK - Number of results (default: 10, max: 100)
   * @param {number} searchParams.alpha - Vector weight 0-1 (optional)
   * @param {string} searchParams.type - Search type: 'hybrid', 'keyword', 'semantic' (default: 'hybrid')
   * @returns {Promise<Object>} Search results
   */
  static async search(searchParams) {
    try {
      const { query, topK = 10, alpha, type = 'hybrid' } = searchParams;

      // Validate query
      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        throw new Error('Search query must be at least 2 characters long');
      }

      if (query.length > 500) {
        throw new Error('Search query must not exceed 500 characters');
      }

      // Validate topK
      if (topK && (topK < 1 || topK > 100)) {
        throw new Error('Number of results must be between 1 and 100');
      }

      // Validate alpha
      if (alpha !== undefined && (alpha < 0 || alpha > 1)) {
        throw new Error('Alpha value must be between 0 and 1');
      }

      // Validate type
      const validTypes = ['hybrid', 'keyword', 'semantic'];
      if (!validTypes.includes(type.toLowerCase())) {
        throw new Error(
          'Search type must be one of: hybrid, keyword, semantic'
        );
      }

      // Build query parameters
      const params = new URLSearchParams({
        q: query.trim(),
        topK: topK.toString(),
        type: type.toLowerCase(),
      });

      if (alpha !== undefined) {
        params.append('alpha', alpha.toString());
      }

      // Get authentication headers
      const headers = AuthService.getAuthHeaders();

      // Make API request
      const response = await fetch(
        `${END_POINTS.search}?${params.toString()}`,
        {
          method: 'GET',
          headers,
          credentials: 'include', // Include cookies if using cookie-based auth
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Search failed with status: ${response.status}`
        );
      }

      const result = await response.json();

      console.log('Search successful:', {
        query: result.query,
        resultsCount: result.resultsCount,
        responseTime: result.responseTimeMs,
        searchType: result.searchType,
      });

      return result;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Get search statistics
   * @returns {Promise<Object>} Search statistics
   */
  static async getSearchStats() {
    try {
      const headers = AuthService.getAuthHeaders();

      const response = await fetch(`${END_POINTS.search}/stats`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to get search stats: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Search stats error:', error);
      throw error;
    }
  }

  /**
   * Transform search results for frontend display
   * @param {Array} results - Raw search results from API
   * @returns {Array} Transformed results for UI
   */
  static transformSearchResults(results) {
    if (!Array.isArray(results)) {
      return [];
    }

    return results.map((result, index) => ({
      id: result.chunkId || `result-${index}`,
      title:
        result.sectionTitle ||
        this.extractTitleFromText(result.text) ||
        'Document Section',
      snippet: this.truncateText(result.text, 200),
      fullAnswer: result.text,
      source: result.filename || 'Unknown Document',
      relevance: Math.round(
        (result.scores?.hybrid || result.scores?.fts || 0) * 100
      ),
      date: this.formatDate(result.uploadedAt),
      scores: result.scores || {},
      documentId: result.documentId,
      clientName: result.clientName,
    }));
  }

  /**
   * Extract title from text content
   * @param {string} text - Text content
   * @returns {string} Extracted title
   */
  static extractTitleFromText(text) {
    if (!text) return '';

    // Try to find the first sentence or meaningful phrase
    const sentences = text.split(/[.!?]+/);
    if (sentences.length > 0) {
      return sentences[0].trim().substring(0, 100);
    }

    return text.substring(0, 100);
  }

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  static truncateText(text, maxLength = 200) {
    if (!text) return '';

    if (text.length <= maxLength) {
      return text;
    }

    // Find the last complete word within the limit
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
  }

  /**
   * Format date for display
   * @param {string} dateString - Date string
   * @returns {string} Formatted date
   */
  static formatDate(dateString) {
    if (!dateString) return 'Unknown Date';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Unknown Date';
    }
  }

  /**
   * Infer category from text content
   * @param {string} text - Text content
   * @returns {string} Inferred category
   */
  static inferCategory(text) {
    if (!text) return 'General';

    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('security') ||
      lowerText.includes('encryption') ||
      lowerText.includes('compliance')
    ) {
      return 'Security';
    }
    if (
      lowerText.includes('financial') ||
      lowerText.includes('budget') ||
      lowerText.includes('cost')
    ) {
      return 'Financial';
    }
    if (
      lowerText.includes('technical') ||
      lowerText.includes('implementation') ||
      lowerText.includes('architecture')
    ) {
      return 'Technical';
    }
    if (
      lowerText.includes('team') ||
      lowerText.includes('experience') ||
      lowerText.includes('qualification')
    ) {
      return 'HR';
    }
    if (
      lowerText.includes('timeline') ||
      lowerText.includes('schedule') ||
      lowerText.includes('milestone')
    ) {
      return 'Timeline';
    }

    return 'General';
  }

  /**
   * Get search type options
   * @returns {Array} Available search types
   */
  static getSearchTypes() {
    return [
      {
        value: 'hybrid',
        label: 'Hybrid (Recommended)',
        description: 'Combines keyword and semantic search',
      },
      {
        value: 'keyword',
        label: 'Keyword',
        description: 'Full-text search for exact matches',
      },
      {
        value: 'semantic',
        label: 'Semantic',
        description: 'AI-powered semantic understanding',
      },
    ];
  }

  /**
   * Validate search query
   * @param {string} query - Search query
   * @returns {Object} Validation result
   */
  static validateQuery(query) {
    const errors = [];

    if (!query || typeof query !== 'string') {
      errors.push('Search query is required');
    } else {
      const trimmed = query.trim();

      if (trimmed.length < 2) {
        errors.push('Search query must be at least 2 characters long');
      }

      if (trimmed.length > 500) {
        errors.push('Search query must not exceed 500 characters');
      }

      // Check for potentially malicious patterns
      const dangerous =
        /(--|;|\/\*|\*\/|xp_|sp_|exec|execute|drop|delete|truncate|alter)/gi;
      if (dangerous.test(trimmed)) {
        errors.push('Query contains invalid characters or patterns');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default SearchService;
