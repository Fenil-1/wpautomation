import { ConflictError } from '../../errors/index.js';
import { config } from '../../config/index.js';
import { createLogger } from '../../lib/logger.js';
import type { DeliveryRepository } from './delivery.repository.js';
import type {
  BroadcastProgress,
  DeliveryQueuePort,
  DeliverySessionProvider,
  EnqueueResult,
} from './delivery.types.js';

const logger = createLogger({ module: 'delivery' });

const JOB_NAME = 'send-recipient';

/** Just enough of the broadcasts service for delivery to validate a broadcast. */
export interface BroadcastGate {
  getById(id: string): Promise<{ id: string; status: string; message: string }>;
}

export interface DeliveryServiceDeps {
  recipients: DeliveryRepository;
  queue: DeliveryQueuePort;
  sessions: DeliverySessionProvider;
  broadcasts: BroadcastGate;
}

/**
 * Delivery business logic: enqueue per-recipient jobs, process a single
 * recipient, and report progress. Contains no Prisma or Baileys code — it
 * depends on the repository, the session interface, and the queue.
 */
export class DeliveryService {
  constructor(private readonly deps: DeliveryServiceDeps) {}

  /**
   * Enqueue one job per pending recipient and return immediately. Requires the
   * broadcast to be resolved (`ready`). Does NOT wait for sending.
   */
  async enqueueBroadcast(broadcastId: string): Promise<EnqueueResult> {
    const broadcast = await this.deps.broadcasts.getById(broadcastId); // throws NotFound
    if (broadcast.status !== 'ready') {
      throw new ConflictError('Broadcast must be resolved (status "ready") before sending.');
    }

    const ids = await this.deps.recipients.listPendingRecipientIds(broadcastId);
    if (ids.length > 0) {
      await this.deps.queue.addBulk(
        ids.map((recipientId) => ({
          name: JOB_NAME,
          data: { recipientId },
          opts: {
            attempts: config.delivery.maxSendRetries,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: true,
            removeOnFail: 1000,
          },
        })),
      );
    }

    logger.info({ broadcastId, enqueued: ids.length }, 'enqueued broadcast delivery jobs');
    return { broadcastId, enqueued: ids.length };
  }

  /**
   * Process ONE recipient. Called by the worker per job.
   *
   * Validation failures (not ready / no phone / opted out / blocked) are marked
   * terminal (`skipped`) and never retried. A disconnected session marks the
   * recipient `failed` without retry. Only genuine send errors throw, which lets
   * BullMQ retry with backoff until `MAX_SEND_RETRIES` is exhausted.
   */
  async processRecipient(recipientId: string): Promise<void> {
    const loaded = await this.deps.recipients.loadForDelivery(recipientId);
    if (!loaded) {
      logger.warn({ recipientId }, 'recipient not found; skipping job');
      return;
    }
    if (loaded.status === 'sent') return; // idempotent: already delivered

    const attempts = await this.deps.recipients.markProcessing(recipientId);
    const { contact, broadcast } = loaded;

    // --- Safety validations (terminal, never retried) ---
    if (broadcast.status !== 'ready') return this.skip(recipientId, 'broadcast is not ready to send');
    if (!contact.phoneNumber) return this.skip(recipientId, 'contact has no phone number');
    if (contact.isOptedOut) return this.skip(recipientId, 'contact has opted out');
    if (contact.isBlocked) return this.skip(recipientId, 'contact is blocked');

    // --- Session must be connected ---
    const session = this.deps.sessions.getDefault();
    if (!session.isConnected()) {
      await this.deps.recipients.markFailed(recipientId, 'WhatsApp session is not connected');
      logger.warn({ recipientId }, 'session not connected; marked failed');
      return;
    }

    // --- Pacing (config-driven random delay before every send) ---
    await this.pace();

    // --- Send ---
    try {
      const { messageId } = await session.sendText({
        countryCode: contact.countryCode,
        phoneNumber: contact.phoneNumber,
        text: broadcast.message,
      });
      await this.deps.recipients.markSent(recipientId, messageId);
      logger.info({ recipientId, messageId }, 'message sent');
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      if (attempts >= config.delivery.maxSendRetries) {
        await this.deps.recipients.markFailed(recipientId, reason);
        logger.warn({ recipientId, attempts, reason }, 'send failed permanently');
        return;
      }
      await this.deps.recipients.markPendingForRetry(recipientId, reason);
      logger.warn({ recipientId, attempt: attempts, reason }, 'send failed; will retry');
      throw err; // let BullMQ retry with backoff
    }
  }

  async getProgress(broadcastId: string): Promise<BroadcastProgress> {
    await this.deps.broadcasts.getById(broadcastId); // throws NotFound
    const counts = await this.deps.recipients.statusCounts(broadcastId);
    const done = counts.sent + counts.failed + counts.skipped;
    const percentage = counts.total === 0 ? 0 : Math.round((done / counts.total) * 100);
    return { broadcastId, ...counts, percentage };
  }

  private async skip(recipientId: string, reason: string): Promise<void> {
    await this.deps.recipients.markSkipped(recipientId, reason);
    logger.info({ recipientId, reason }, 'recipient skipped');
  }

  /** Wait a random delay within the configured window before sending. */
  private pace(): Promise<void> {
    const { sendDelayMinMs, sendDelayMaxMs } = config.delivery;
    const delay = sendDelayMinMs + Math.floor(Math.random() * (sendDelayMaxMs - sendDelayMinMs + 1));
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
