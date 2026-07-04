import { Redis } from 'ioredis';
import { config } from '../config/index.js';
import { logger } from './logger.js';

/**
 * Shared Redis client for general application use (caching, rate limits, etc.).
 *
 * NOTE: BullMQ requires its own connections with `maxRetriesPerRequest: null`.
 * Do NOT reuse this client for queues — use the factory in `lib/queue.ts`.
 *
 * `lazyConnect` defers the TCP connection until the first command (or an
 * explicit `connect()`), which keeps boot resilient when Redis is temporarily
 * unavailable.
 */
export const redis = new Redis(config.redis.url, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    // Exponential-ish backoff, capped at 2s.
    return Math.min(times * 200, 2000);
  },
});

redis.on('connect', () => logger.info('redis connected'));
redis.on('ready', () => logger.debug('redis ready'));
redis.on('error', (err: Error) =>
  logger.warn({ err: err.message }, 'redis connection error'),
);
redis.on('close', () => logger.debug('redis connection closed'));

/**
 * Best-effort connect at boot. Failure is logged but non-fatal — the health
 * check will surface Redis as `down` rather than crashing the whole service.
 */
export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      'redis initial connect failed (continuing; health check will report status)',
    );
  }
}

/** Gracefully close the Redis connection. Called on shutdown. */
export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit();
    logger.info('redis disconnected');
  } catch {
    redis.disconnect();
  }
}
