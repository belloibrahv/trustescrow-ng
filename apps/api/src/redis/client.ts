// apps/api/src/redis/client.ts
import { Redis } from 'ioredis';
import { env } from '../config/env';

export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  lazyConnect: true, // Don't connect immediately - wait until first use
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000);
    console.log(`🔄 Redis retry ${times}, waiting ${delay}ms`);
    return delay;
  },
  connectTimeout: 10000, // 10 second timeout
  commandTimeout: 5000,  // 5 second command timeout
});

redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
  // Don't crash the app on Redis errors
});
redisClient.on('ready', () => console.log('✅ Redis ready for commands'));
redisClient.on('close', () => console.log('⚠️ Redis connection closed'));
