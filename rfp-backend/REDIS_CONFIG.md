# Redis Configuration for BullMQ

## Overview

This project uses Redis as the backend for BullMQ job queues. To ensure compatibility with BullMQ and prevent deprecation warnings, we've centralized the Redis connection configuration.

## Shared Redis Connection Helper

All Redis connections are now managed through a shared helper function located at:

```
src/config/redis.js
```

### Configuration

```javascript
const connection = createRedisConnection();
```

This creates a Redis connection with:
- ✅ `maxRetriesPerRequest: null` - Required by BullMQ
- ✅ `enableReadyCheck: false` - Faster startup
- ✅ Exponential backoff retry strategy
- ✅ Environment-based configuration

## Files Using Shared Redis Connection

All queue and worker files now use the shared connection helper:

1. **Workers (Consumers)**:
   - `src/services/queue/dequeue/ingestWorker.js`
   - `src/services/queue/dequeue/embedWorker.js`

2. **Queues (Producers)**:
   - `src/services/queue/enqueue/ingestJob.js`
   - `src/services/queue/enqueue/embedQueue.js`

## Benefits

✅ **Centralized Configuration**: Single source of truth for Redis settings
✅ **No Deprecation Warnings**: Properly configured for BullMQ
✅ **Maintainability**: Easy to update Redis settings in one place
✅ **Consistency**: All workers and queues use identical configuration
✅ **Retry Logic**: Built-in exponential backoff for connection failures

## Environment Variables

Configure Redis connection via `.env`:

```bash
REDIS_HOST=redis
REDIS_PORT=6379
```

## Verifying Configuration

Check that workers start without warnings:

```bash
# Check worker logs
docker-compose logs worker --tail 20
docker-compose logs embed-worker --tail 20

# Expected: No "maxRetriesPerRequest" deprecation warnings
```

## Troubleshooting

If you see deprecation warnings:

1. Verify all queue/worker files import from `config/redis.js`
2. Restart the containers: `docker-compose restart worker embed-worker`
3. Check logs: `docker-compose logs worker embed-worker`

## Migration Notes

**Before**: Each file created its own Redis connection
```javascript
const connection = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: process.env.REDIS_PORT || 6379,
});
```

**After**: All files use the shared helper
```javascript
const { createRedisConnection } = require("../../../config/redis");
const connection = createRedisConnection();
```

## References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [ioredis Configuration](https://github.com/luin/ioredis)

