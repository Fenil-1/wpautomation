import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { config } from '../../config/index.js';
import { HEALTH_PROBE_TIMEOUT_MS } from '../../utils/constants.js';
import { nowIso, uptimeSeconds } from '../../utils/date.js';
import type { DependencyHealth, HealthReport } from '../../types/index.js';

/** Reject a probe if it hasn't settled within the timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`probe timed out after ${ms}ms`)), ms),
    ),
  ]);
}

async function probe(fn: () => Promise<unknown>): Promise<DependencyHealth> {
  const startedAt = Date.now();
  try {
    await withTimeout(fn(), HEALTH_PROBE_TIMEOUT_MS);
    return { status: 'up', latencyMs: Date.now() - startedAt };
  } catch (err) {
    return {
      status: 'down',
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Health service — the only piece of business logic in Stage 0.
 *
 * Probes each critical dependency independently and reports an aggregate
 * status. The service degrades gracefully: a downed dependency yields a
 * `degraded` report rather than throwing, so orchestrators can read the body.
 */
export async function getHealthReport(): Promise<HealthReport> {
  const [database, redisHealth] = await Promise.all([
    probe(() => prisma.$queryRaw`SELECT 1`),
    probe(() => redis.ping()),
  ]);

  const allUp = database.status === 'up' && redisHealth.status === 'up';

  return {
    status: allUp ? 'ok' : 'degraded',
    service: config.app.name,
    version: config.app.version,
    environment: config.app.env,
    uptimeSeconds: uptimeSeconds(),
    timestamp: nowIso(),
    dependencies: {
      database,
      redis: redisHealth,
    },
  };
}
