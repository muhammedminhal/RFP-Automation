// src/services/uploadService.js
import AuthService from './authService';
import { FILE_UPLOAD } from '../constants/ui';

/**
 * Upload Service for handling document uploads
 */
class UploadService {
  /**
   * Upload documents to the backend
   * @param {File[]} files - Array of files to upload
   * @param {string} clientName - Name of the client
   * @returns {Promise<Object>} Upload response
   */
  static async uploadDocuments(files, clientName) {
    try {
      // Validate inputs
      if (!files || files.length === 0) {
        throw new Error('No files provided');
      }

      if (!clientName || typeof clientName !== 'string' || !clientName.trim()) {
        throw new Error('Client name is required');
      }

      // Validate file types and sizes
      this.validateFiles(files);

      // Create FormData
      const formData = new FormData();
      formData.append('clientName', clientName.trim());

      // Add files to FormData
      files.forEach(file => {
        formData.append('files', file);
      });

      // Get authentication headers
      const headers = AuthService.getAuthHeaders();
      // Remove Content-Type header to let browser set it with boundary for FormData
      delete headers['Content-Type'];

      // Make API request
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include', // Include cookies if using cookie-based auth
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Upload failed with status: ${response.status}`
        );
      }

      const result = await response.json();

      console.log('Upload successful:', result);
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Validate files before upload
   * @param {File[]} files - Files to validate
   */
  static validateFiles(files) {
    if (files.length > FILE_UPLOAD.MAX_FILES) {
      throw new Error(`Maximum ${FILE_UPLOAD.MAX_FILES} files allowed`);
    }

    files.forEach(file => {
      // Check file size
      if (file.size > FILE_UPLOAD.MAX_FILE_SIZE) {
        throw new Error(
          `File "${file.name}" exceeds maximum size of ${this.formatFileSize(FILE_UPLOAD.MAX_FILE_SIZE)}`
        );
      }

      // Check file type
      if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.type)) {
        const allowedExtensions = FILE_UPLOAD.ALLOWED_EXTENSIONS.join(', ');
        throw new Error(
          `File "${file.name}" is not supported. Allowed types: ${allowedExtensions}`
        );
      }
    });
  }

  /**
   * Format file size in human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get upload progress (placeholder for future implementation)
   * @param {XMLHttpRequest} xhr - XMLHttpRequest object
   * @returns {Promise<number>} Upload progress percentage
   */
  static getUploadProgress(xhr) {
    return new Promise(resolve => {
      if (xhr.upload) {
        xhr.upload.addEventListener('progress', event => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total);
            resolve(progress);
          }
        });
      }
    });
  }

  /**
   * Get supported file types for display
   * @returns {string} Supported file types description
   */
  static getSupportedFileTypes() {
    return FILE_UPLOAD.ALLOWED_EXTENSIONS.map(ext => ext.toUpperCase()).join(
      ', '
    );
  }

  /**
   * Get maximum file size for display
   * @returns {string} Maximum file size
   */
  static getMaxFileSize() {
    return this.formatFileSize(FILE_UPLOAD.MAX_FILE_SIZE);
  }

  /**
   * Get maximum number of files
   * @returns {number} Maximum number of files
   */
  static getMaxFiles() {
    return FILE_UPLOAD.MAX_FILES;
  }
}

export default UploadService;
