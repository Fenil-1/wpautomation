import { buildApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './lib/logger.js';
import { connectRedis, disconnectRedis } from './lib/redis.js';
import { disconnectPrisma } from './lib/prisma.js';
import { sessionManager } from './modules/session/index.js';

/**
 * Process entrypoint. Owns the full lifecycle: boot dependencies, start the
 * HTTP server, and shut everything down cleanly on signals.
 */
async function main(): Promise<void> {
  // Best-effort dependency warm-up. Redis failing here is non-fatal; the health
  // endpoint reports live status regardless.
  await connectRedis();

  const app = await buildApp();

  await app.listen({ host: config.http.host, port: config.http.port });
  logger.info(
    { url: `http://${config.http.host}:${config.http.port}${'/api/health'}` },
    `${config.app.name} v${config.app.version} listening`,
  );

  // Restore a previously-authenticated WhatsApp session (if any) after restart.
  // Best-effort: failures are logged inside the manager and never block boot.
  await sessionManager.restore();

  // Graceful shutdown.
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutting down');
    try {
      await sessionManager.shutdown();
      await app.close();
      await disconnectPrisma();
      await disconnectRedis();
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'error during shutdown');
      process.exit(1);
    }
  };

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => void shutdown(signal));
  }
}

main().catch((err) => {
  logger.error({ err }, 'fatal error during startup');
  process.exit(1);
});
