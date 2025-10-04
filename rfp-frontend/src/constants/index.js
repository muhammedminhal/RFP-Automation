/**
 * Application Constants
 * Centralized location for all application constants
 */

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE: '/api/auth/google',
    LOGOUT: '/auth/logout',
    ME: '/api/me',
    UNAUTHORIZED: '/auth/unauthorized',
  },
  HEALTH: '/api/health',
  ADMIN: {
    AUTHORIZED_EMAILS: '/admin/authorized-emails',
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'rfp_auth_token',
  REFRESH_TOKEN: 'rfp_refresh_token',
  USER_DATA: 'rfp_user_data',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SEARCH: '/search',
  RFP_DOCUMENTS: '/rfp-documents',
  CLIENT_DOCUMENTS: '/client-documents',
  SETTINGS: '/settings',
  HELP: '/help',
  UNAUTHORIZED: '/unauthorized',
};

// UI Constants
export const UI_CONSTANTS = {
  LOADING_TIMEOUT: 3000,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: {
    SHORT: 150,
    MEDIUM: 300,
    LONG: 500,
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  AUTH: {
    LOGIN_FAILED: 'Login failed. Please try again.',
    SESSION_EXPIRED: 'Your session has expired. Please login again.',
    UNAUTHORIZED: 'You are not authorized to access this resource.',
    TOKEN_INVALID: 'Invalid authentication token.',
  },
  NETWORK: {
    CONNECTION_ERROR: 'Network connection error. Please check your internet.',
    SERVER_ERROR: 'Server error. Please try again later.',
    TIMEOUT: 'Request timed out. Please try again.',
  },
  GENERAL: {
    UNKNOWN_ERROR: 'An unexpected error occurred.',
    LOADING_ERROR: 'Failed to load data.',
  },
};

// Success Messages
export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Successfully logged in!',
    LOGOUT_SUCCESS: 'Successfully logged out!',
  },
  GENERAL: {
    DATA_SAVED: 'Data saved successfully!',
    OPERATION_COMPLETE: 'Operation completed successfully!',
  },
};

// Application Metadata
export const APP_INFO = {
  NAME: 'InApp RFP Automation',
  VERSION: '1.0.0',
  DESCRIPTION: 'Streamline your RFP process with intelligent automation',
  COPYRIGHT: '© 2025 InApp RFP Automation. All rights reserved.',
};

// Feature Flags (for future use)
export const FEATURES = {
  DARK_MODE: true, // Updated: dark mode is now available
  ANALYTICS: true,
  NOTIFICATIONS: true,
  REAL_TIME_UPDATES: false,
};

// Export all UI constants (sizes, z-index, animations, file upload, etc.)
export * from './ui';
