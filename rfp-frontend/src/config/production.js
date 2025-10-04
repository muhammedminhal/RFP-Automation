/**
 * Production Configuration
 * Environment-specific settings for production builds
 */

const productionConfig = {
  // API Configuration
  API: {
    BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },

  // Application Settings
  APP: {
    NAME: 'InApp RFP Automation',
    VERSION: process.env.REACT_APP_VERSION || '1.0.0',
    ENVIRONMENT: process.env.REACT_APP_ENV || 'development',
    DEBUG: process.env.REACT_APP_ENABLE_DEBUG === 'true',
  },

  // Feature Flags
  FEATURES: {
    ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    PERFORMANCE_MONITORING:
      process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true',
    ERROR_REPORTING: true,
    CACHE_ENABLED: true,
  },

  // Performance Settings
  PERFORMANCE: {
    LAZY_LOADING: true,
    CODE_SPLITTING: true,
    IMAGE_OPTIMIZATION: true,
    BUNDLE_ANALYSIS: false,
  },

  // Security Settings
  SECURITY: {
    HTTPS_ONLY: true,
    CONTENT_SECURITY_POLICY: true,
    XSS_PROTECTION: true,
  },

  // Caching
  CACHE: {
    STATIC_ASSETS: 31536000, // 1 year
    API_RESPONSES: 300, // 5 minutes
    USER_DATA: 3600, // 1 hour
  },
};

export default productionConfig;
