import { Redis, type RedisOptions } from 'ioredis';
import { config } from '../config/index.js';
import { logger } from './logger.js';

/**
 * BullMQ initialization — STAGE 0: connection wiring ONLY.
 *
 * No queues, workers, schedulers, or jobs are defined yet. This module simply
 * establishes the correct Redis connection contract that BullMQ requires, so
 * future stages can add queues without re-deriving these settings.
 *
 * BullMQ mandates `maxRetriesPerRequest: null` on its connections; reusing the
 * general-purpose client from `lib/redis.ts` (which sets a finite retry count)
 * is unsupported and will throw at runtime.
 */
export const bullConnectionOptions: RedisOptions = {
  maxRetriesPerRequest: null,
};

/**
 * Create a fresh Redis connection suitable for a BullMQ Queue or Worker.
 * Each Worker should generally own its own connection.
 */
export function createBullConnection(): Redis {
  const connection = new Redis(config.redis.url, bullConnectionOptions);
  connection.on('error', (err: Error) =>
    logger.warn({ err: err.message }, 'bullmq redis connection error'),
  );
  return connection;
}
