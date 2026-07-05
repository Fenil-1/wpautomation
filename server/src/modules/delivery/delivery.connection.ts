import { config } from '../../config/index.js';

/**
 * BullMQ Redis connection options, derived from config.
 *
 * We pass plain options (not a shared ioredis instance) so BullMQ owns its own
 * clients — this sidesteps the BullMQ/ioredis dual-package type hazard (BullMQ
 * bundles its own ioredis version). `maxRetriesPerRequest: null` is required by
 * BullMQ.
 */
const url = new URL(config.redis.url);

export const deliveryConnection = {
  host: url.hostname,
  port: url.port ? Number(url.port) : 6379,
  ...(url.username ? { username: decodeURIComponent(url.username) } : {}),
  ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
  maxRetriesPerRequest: null,
};
