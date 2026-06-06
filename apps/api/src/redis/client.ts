// apps/api/src/redis/client.ts
import { Redis } from 'ioredis';
import { env } from '../config/env';

export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  lazyConnect: false,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('error', (err) => console.error('❌ Redis error:', err.message));
