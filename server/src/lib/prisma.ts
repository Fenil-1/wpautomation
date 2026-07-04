import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';
import { logger } from './logger.js';

/**
 * Prisma Client singleton.
 *
 * A single PrismaClient instance is shared process-wide. We stash it on
 * `globalThis` in non-production environments so hot-reloading (tsx watch)
 * doesn't leak a new connection pool on every reload.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.app.isDevelopment
      ? ['warn', 'error']
      : ['error'],
  });

if (!config.app.isProduction) {
  globalForPrisma.prisma = prisma;
}

/** Gracefully close the database connection pool. Called on shutdown. */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  logger.info('prisma disconnected');
}
