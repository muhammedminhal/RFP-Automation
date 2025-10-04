require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');

const config = require('./config');
const pool = require('./config/db/pool');
const routes = require('./routes');
const uploadRoutes = require('./routes/uploadRoutes.js');
const { logger, requestLogger } = require('./utils/logger');

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  // Log incoming request
  requestLogger.request('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    timestamp: new Date().toISOString()
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'error' : res.statusCode >= 300 ? 'warn' : 'info';
    
    requestLogger[logLevel](`Request completed`, {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length')
    });
  });

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session (dev only). Replace with Redis store in prod.
app.use(session({
  secret: config.SESSION_SECRET || 'please-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: config.NODE_ENV === 'production' }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());
require('./controllers/authController').init(passport);

// Routes
app.use('/api', routes);
app.use('/api/upload', uploadRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error occurred', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Don't expose internal errors in production
  const errorResponse = {
    error: config.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    timestamp: new Date().toISOString()
  };

  if (config.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(err.status || 500).json(errorResponse);
});

// 404 handler
app.use('*', (req, res) => {
  requestLogger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = config.PORT || 3001;
app.listen(PORT, () => {
  logger.info('RFP Backend Server Started', {
    port: PORT,
    environment: config.NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  });
  
  // Log configuration status
  logger.info('Server Configuration', {
    googleOAuthConfigured: !!(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET),
    jwtSecretConfigured: !!config.JWT_SECRET,
    sessionSecretConfigured: !!config.SESSION_SECRET,
    frontendUrl: config.FRONTEND_URL,
    callbackUrl: config.GOOGLE_CALLBACK_URL,
    databaseHost: config.POSTGRES_HOST,
    redisHost: config.REDIS_HOST
  });
});