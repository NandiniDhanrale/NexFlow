import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function createRedisClient(): Redis {
  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => {
      if (times > 10) return null;
      return Math.min(times * 200, 5000);
    },
  });

  client.on('connect', () => console.log('Redis connected'));
  client.on('error', (err) => console.error('Redis error:', err.message));
  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();
globalForRedis.redis = redis;

export async function initRedis(): Promise<void> {
  try {
    await redis.ping();
  } catch (error) {
    console.error('Redis connection failed:', error);
    throw error;
  }
}
