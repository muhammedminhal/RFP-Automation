// src/config/index.js
module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3001,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  POSTGRES_HOST: process.env.POSTGRES_HOST || 'db',
  POSTGRES_PORT: Number(process.env.POSTGRES_PORT || 5432),
  POSTGRES_DB: process.env.POSTGRES_DB || 'rfpdb',
  POSTGRES_USER: process.env.POSTGRES_USER || 'rfpuser',
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'rfppassword',
  REDIS_HOST: process.env.REDIS_HOST || 'redis',
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  SESSION_SECRET: process.env.SESSION_SECRET || 'change_me',
  EMBEDDING_DIM: Number(process.env.EMBEDDING_DIM || 384),
  USE_XENOVA: (process.env.USE_XENOVA || 'false') === 'true',
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2',
  EMBED_BATCH_SIZE: Number(process.env.EMBED_BATCH_SIZE || 32),
  EMBED_WORKER_CONCURRENCY: Number(process.env.EMBED_WORKER_CONCURRENCY || 2),
  // Search configuration
  SEARCH_ALPHA: Number(process.env.SEARCH_ALPHA || 0.6), // Vector weight in hybrid search (0-1, higher = more semantic)
  SEARCH_DEFAULT_TOPK: Number(process.env.SEARCH_DEFAULT_TOPK || 10),
  SEARCH_MAX_TOPK: Number(process.env.SEARCH_MAX_TOPK || 100),
  SEARCH_ENABLE_LOGGING: (process.env.SEARCH_ENABLE_LOGGING || 'true') === 'true'
};
