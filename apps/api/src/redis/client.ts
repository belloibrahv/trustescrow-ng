// apps/api/src/redis/client.ts
import { Redis } from 'ioredis';
import { env } from '../config/env';

type StoredValue = {
  value: string;
  expiresAt?: number;
};

type RedisLike = Pick<
  Redis,
  'get' | 'set' | 'del' | 'incr' | 'expire' | 'ttl' | 'quit' | 'disconnect' | 'on'
> & {
  status: string;
};

const memoryStore = new Map<string, StoredValue>();

function pruneExpired(key: string): StoredValue | undefined {
  const entry = memoryStore.get(key);
  if (!entry) return undefined;

  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return undefined;
  }

  return entry;
}

function createFallbackRedisClient(): RedisLike {
  return {
    status: 'end',

    async get(key: string) {
      const entry = pruneExpired(key);
      return entry?.value ?? null;
    },

    async set(key: string, value: string, mode?: string, ttl?: number, flag?: string) {
      const existing = pruneExpired(key);

      if (flag === 'NX' && existing) {
        return null;
      }

      const next: StoredValue = { value };
      if (mode === 'EX' && typeof ttl === 'number') {
        next.expiresAt = Date.now() + ttl * 1000;
      }

      memoryStore.set(key, next);
      return 'OK';
    },

    async del(key: string) {
      return memoryStore.delete(key) ? 1 : 0;
    },

    async incr(key: string) {
      const entry = pruneExpired(key);
      const current = entry ? Number.parseInt(entry.value, 10) || 0 : 0;
      const nextValue = current + 1;
      memoryStore.set(key, {
        value: String(nextValue),
        expiresAt: entry?.expiresAt,
      });
      return nextValue;
    },

    async expire(key: string, seconds: number) {
      const entry = pruneExpired(key);
      if (!entry) return 0;

      memoryStore.set(key, {
        ...entry,
        expiresAt: Date.now() + seconds * 1000,
      });
      return 1;
    },

    async ttl(key: string) {
      const entry = pruneExpired(key);
      if (!entry) return -2;
      if (!entry.expiresAt) return -1;
      return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
    },

    async quit() {
      return 'OK';
    },

    async disconnect() {
      return undefined;
    },

    on() {
      return this;
    },
  } as unknown as RedisLike;
}

export const redisAvailable = Boolean(env.REDIS_URL && env.REDIS_URL.trim().length > 0);

export const redisClient: RedisLike = redisAvailable
  ? new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      lazyConnect: true, // Don't connect immediately - wait until first use
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        console.log(`🔄 Redis retry ${times}, waiting ${delay}ms`);
        return delay;
      },
      connectTimeout: 10000, // 10 second timeout
      commandTimeout: 5000, // 5 second command timeout
    })
  : createFallbackRedisClient();

if (redisAvailable) {
  redisClient.on('connect', () => console.log('✅ Redis connected'));
  redisClient.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
    // Don't crash the app on Redis errors
  });
  redisClient.on('ready', () => console.log('✅ Redis ready for commands'));
  redisClient.on('close', () => console.log('⚠️ Redis connection closed'));
} else {
  console.warn('⚠️ Redis URL not configured — using in-memory fallback for locks and counters');
}
