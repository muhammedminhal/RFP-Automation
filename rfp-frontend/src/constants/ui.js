/**
 * UI Constants for RFP Automation Application
 * Central location for magic numbers, timeouts, sizes, and other UI values
 */

// Animation Durations (ms)
export const ANIMATION_DURATION = {
  SHORT: 150,
  MEDIUM: 300,
  LONG: 500,
  EXTRA_LONG: 1000,
};

// Sizes (px)
export const SIZES = {
  AVATAR_SIZE: 40,
  ICON_SMALL: 16,
  ICON_MEDIUM: 24,
  ICON_LARGE: 32,
  SIDEBAR_WIDTH: 280,
  SIDEBAR_COLLAPSED_WIDTH: 72,
  HEADER_HEIGHT: 64,
  BORDER_RADIUS_SMALL: 8,
  BORDER_RADIUS_MEDIUM: 12,
  BORDER_RADIUS_LARGE: 16,
};

// Spacing (px)
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  XXL: 32,
};

// Z-Index Layers
export const Z_INDEX = {
  BASE: 1,
  DROPDOWN: 100,
  SIDEBAR: 1001,
  SIDEBAR_OVERLAY: 1000,
  SIDEBAR_TOGGLE: 999,
  MODAL: 2000,
  MODAL_BACKDROP: 1999,
  TOOLTIP: 3000,
  NOTIFICATION: 4000,
};

// Breakpoints (px)
export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1280,
  ULTRA_WIDE: 1920,
};

// File Upload
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 10,
  ALLOWED_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  ALLOWED_EXTENSIONS: [
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.txt',
    '.ppt',
    '.pptx',
  ],
};

// Messages
export const MESSAGES = {
  FILE_UPLOAD_SUCCESS: 'Files uploaded successfully!',
  FILE_UPLOAD_ERROR: 'Error uploading files. Please try again.',
  FILE_SIZE_ERROR: `File size exceeds maximum limit of ${FILE_UPLOAD.MAX_FILE_SIZE / (1024 * 1024)}MB.`,
  FILE_TYPE_ERROR:
    'File type not supported. Please upload PDF, DOCX, XLSX, TXT, or PPT files.',
  COPY_SUCCESS: 'Copied to clipboard!',
  COPY_ERROR: 'Failed to copy to clipboard.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
};

// Timeout Durations (ms)
export const TIMEOUT = {
  DEBOUNCE_SHORT: 300,
  DEBOUNCE_MEDIUM: 500,
  DEBOUNCE_LONG: 1000,
  API_REQUEST: 30000, // 30 seconds
  TOAST_NOTIFICATION: 3000,
};
