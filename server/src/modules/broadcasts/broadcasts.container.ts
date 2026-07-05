import { prisma } from '../../lib/prisma.js';
import { BroadcastRepository } from './broadcast.repository.js';
import { BroadcastService } from './broadcast.service.js';

/**
 * Composition root for the broadcasts module. Wires the Prisma singleton
 * through the repository into the service exactly once.
 */
const broadcastRepository = new BroadcastRepository(prisma);

export const broadcastService = new BroadcastService(broadcastRepository);
