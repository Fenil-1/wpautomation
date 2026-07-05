import { join } from 'node:path';
import { env } from './env.js';

/**
 * Centralized, structured application configuration.
 *
 * Grouping the flat env vars into cohesive sections keeps call sites readable
 * (`config.http.port`, `config.redis.url`) and gives us one obvious place to
 * add derived or composite settings later. Consume this instead of `env`
 * wherever practical.
 */
export const config = {
  app: {
    name: env.APP_NAME,
    version: env.APP_VERSION,
    env: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',
  },
  http: {
    host: env.HOST,
    port: env.PORT,
  },
  log: {
    level: env.LOG_LEVEL,
  },
  database: {
    url: env.DATABASE_URL,
  },
  redis: {
    url: env.REDIS_URL,
  },
  storage: {
    dataDir: env.DATA_DIR,
    /** Where per-session auth credentials and metadata are stored locally. */
    sessionsDir: join(env.DATA_DIR, 'sessions'),
  },
  delivery: {
    /** Random pre-send delay window (pacing), in ms. */
    sendDelayMinMs: env.SEND_DELAY_MIN_MS,
    sendDelayMaxMs: env.SEND_DELAY_MAX_MS,
    /** Max BullMQ attempts per recipient (initial try + retries). */
    maxSendRetries: env.MAX_SEND_RETRIES,
    /** Queue name for per-recipient delivery jobs. */
    queueName: 'broadcast-delivery',
  },
} as const;

export type Config = typeof config;
