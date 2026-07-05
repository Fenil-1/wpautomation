import { prisma } from '../../lib/prisma.js';
import { broadcastService } from '../broadcasts/index.js';
import { sessionManager } from '../session/index.js';
import { DeliveryRepository } from './delivery.repository.js';
import { DeliveryService } from './delivery.service.js';
import { deliveryQueue } from './delivery.queue.js';

/**
 * Composition root for the delivery module. Wires the Prisma singleton, the
 * shared SessionManager (WhatsApp send capability), the broadcasts service
 * (validation), and the delivery queue into the DeliveryService.
 */
const deliveryRepository = new DeliveryRepository(prisma);

export const deliveryService = new DeliveryService({
  recipients: deliveryRepository,
  queue: deliveryQueue,
  sessions: sessionManager,
  broadcasts: broadcastService,
});
