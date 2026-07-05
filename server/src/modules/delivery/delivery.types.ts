/** Payload of a single delivery job — one job represents ONE recipient. */
export interface DeliveryJobData {
  recipientId: string;
}

/** Subset of BullMQ job options the delivery layer sets (keeps the service off BullMQ's generics). */
export interface DeliveryJobOptions {
  attempts?: number;
  backoff?: { type: string; delay?: number };
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

/** The queue capability the service needs — satisfied by a BullMQ Queue. */
export interface DeliveryQueuePort {
  addBulk(
    jobs: Array<{ name: string; data: DeliveryJobData; opts?: DeliveryJobOptions }>,
  ): Promise<unknown>;
}

/** Result of enqueuing a broadcast for delivery. */
export interface EnqueueResult {
  broadcastId: string;
  enqueued: number;
}

/** Delivery progress for a broadcast. */
export interface BroadcastProgress {
  broadcastId: string;
  total: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  skipped: number;
  /** Share of terminal recipients (sent+failed+skipped) over total, 0–100. */
  percentage: number;
}

/**
 * The minimal WhatsApp capability the delivery layer needs. Implemented by
 * SessionService — the delivery module depends on this interface, never on
 * Baileys directly.
 */
export interface DeliverySession {
  isConnected(): boolean;
  sendText(params: {
    countryCode: string;
    phoneNumber: string;
    text: string;
  }): Promise<{ messageId: string; jid: string }>;
}

export interface DeliverySessionProvider {
  getDefault(): DeliverySession;
}
