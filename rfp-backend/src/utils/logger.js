// src/utils/logger.js
const config = require('../config');

/**
 * Enhanced logging utility with different log levels and structured logging
 */
class Logger {
  constructor(module = 'APP') {
    this.module = module;
  }

  formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const moduleTag = `[${this.module}-${level}]`;
    return `${moduleTag} ${timestamp} - ${message}`;
  }

  info(message, data = {}) {
    console.log(this.formatMessage('INFO', message), data);
  }

  error(message, error = {}) {
    console.error(this.formatMessage('ERROR', message), error);
  }

  warn(message, data = {}) {
    console.warn(this.formatMessage('WARN', message), data);
  }

  debug(message, data = {}) {
    if (config.NODE_ENV === 'development') {
      console.log(this.formatMessage('DEBUG', message), data);
    }
  }

  // Specialized logging methods
  auth(message, data = {}) {
    this.info(`[AUTH] ${message}`, data);
  }

  authError(message, error = {}) {
    this.error(`[AUTH-ERROR] ${message}`, error);
  }

  request(message, data = {}) {
    this.info(`[REQUEST] ${message}`, data);
  }

  database(message, data = {}) {
    this.info(`[DATABASE] ${message}`, data);
  }

  databaseError(message, error = {}) {
    this.error(`[DATABASE-ERROR] ${message}`, error);
  }

  // Performance logging
  performance(message, data = {}) {
    this.info(`[PERFORMANCE] ${message}`, data);
  }

  // Security logging
  security(message, data = {}) {
    this.warn(`[SECURITY] ${message}`, data);
  }

  // Business logic logging
  business(message, data = {}) {
    this.info(`[BUSINESS] ${message}`, data);
  }
}

// Create default logger instance
const defaultLogger = new Logger('RFP-BACKEND');

// Create specialized loggers
const authLogger = new Logger('AUTH');
const requestLogger = new Logger('REQUEST');
const databaseLogger = new Logger('DATABASE');

module.exports = {
  Logger,
  logger: defaultLogger,
  authLogger,
  requestLogger,
  databaseLogger,
  
  // Convenience functions
  createLogger: (module) => new Logger(module)
};
