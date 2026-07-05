import { Queue } from 'bullmq';
import { config } from '../../config/index.js';
import { deliveryConnection } from './delivery.connection.js';
import type { DeliveryJobData } from './delivery.types.js';

/**
 * The `broadcast-delivery` queue. One job per BroadcastRecipient.
 */
export const deliveryQueue = new Queue<DeliveryJobData>(config.delivery.queueName, {
  connection: deliveryConnection,
});
