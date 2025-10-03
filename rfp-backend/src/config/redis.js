// src/config/redis.js
// Shared Redis connection configuration for BullMQ

const Redis = require("ioredis");
const config = require('./index');

/**
 * Create a Redis connection with BullMQ-compatible settings
 * @returns {Redis} - Redis connection instance
 */
function createRedisConnection() {
  return new Redis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    maxRetriesPerRequest: null, // Required by BullMQ to prevent deprecation warning
    enableReadyCheck: false,
    retryStrategy: (times) => {
      // Exponential backoff with max delay of 2 seconds
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
}

module.exports = { createRedisConnection };

