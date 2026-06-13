import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis | null => {
  if (!env.redis.enabled) return null;
  if (redisClient) return redisClient;

  redisClient = new Redis(env.redis.url || 'redis://localhost:6379', {
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redisClient.on('connect', () => logger.info('✅ Redis connected'));
  redisClient.on('error', (err) => {
    logger.warn('Redis error (continuing without cache):', err.message);
    redisClient = null;
  });

  return redisClient;
};

export const connectRedis = async (): Promise<void> => {
  if (!env.redis.enabled) {
    logger.info('Redis disabled. Running without cache.');
    return;
  }
  try {
    const client = getRedisClient();
    if (client) await client.connect();
  } catch {
    logger.warn('Redis connection failed. Continuing without cache.');
  }
};
