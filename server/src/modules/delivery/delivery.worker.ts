import { Worker } from 'bullmq';
import { config } from '../../config/index.js';
import { createLogger } from '../../lib/logger.js';
import { deliveryConnection } from './delivery.connection.js';
import { deliveryService } from './delivery.container.js';
import type { DeliveryJobData } from './delivery.types.js';

const logger = createLogger({ module: 'delivery-worker' });

/**
 * Start the delivery worker. Deliberately tiny — it only translates a job into
 * a `processRecipient` call; all logic lives in the service. Concurrency is 1
 * so a single WhatsApp session sends sequentially and the pacing delay is
 * respected between messages.
 */
export function startDeliveryWorker(): Worker<DeliveryJobData> {
  const worker = new Worker<DeliveryJobData>(
    config.delivery.queueName,
    async (job) => {
      await deliveryService.processRecipient(job.data.recipientId);
    },
    { connection: deliveryConnection, concurrency: 1 },
  );

  worker.on('failed', (job, err) =>
    logger.warn(
      { jobId: job?.id, recipientId: job?.data?.recipientId, err: err.message },
      'delivery job failed (will retry if attempts remain)',
    ),
  );
  worker.on('completed', (job) =>
    logger.debug({ jobId: job.id, recipientId: job.data.recipientId }, 'delivery job completed'),
  );
  worker.on('error', (err) => logger.error({ err: err.message }, 'delivery worker error'));

  logger.info({ queue: config.delivery.queueName, concurrency: 1 }, 'delivery worker started');
  return worker;
}
