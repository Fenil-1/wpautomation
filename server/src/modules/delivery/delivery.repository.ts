import type { Broadcast, BroadcastRecipient, Contact, PrismaClient, RecipientStatus } from '@prisma/client';

export type RecipientForDelivery = BroadcastRecipient & {
  contact: Contact;
  broadcast: Broadcast;
};

export interface StatusCounts {
  total: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  skipped: number;
}

/**
 * Data-access layer for delivery. Owns all Prisma access for BroadcastRecipient
 * delivery state. The worker/service never touch Prisma directly.
 */
export class DeliveryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** Ids of recipients still awaiting a first delivery attempt. */
  async listPendingRecipientIds(broadcastId: string): Promise<string[]> {
    const rows = await this.prisma.broadcastRecipient.findMany({
      where: { broadcastId, status: 'pending' },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  /** Load a recipient with its contact and broadcast for processing. */
  loadForDelivery(recipientId: string): Promise<RecipientForDelivery | null> {
    return this.prisma.broadcastRecipient.findUnique({
      where: { id: recipientId },
      include: { contact: true, broadcast: true },
    });
  }

  /** Mark a recipient as being processed; bumps the attempt counter. Returns the new count. */
  async markProcessing(recipientId: string): Promise<number> {
    const row = await this.prisma.broadcastRecipient.update({
      where: { id: recipientId },
      data: { status: 'processing', attempts: { increment: 1 }, lastAttemptAt: new Date() },
      select: { attempts: true },
    });
    return row.attempts;
  }

  async markSent(recipientId: string, messageId: string): Promise<void> {
    await this.prisma.broadcastRecipient.update({
      where: { id: recipientId },
      data: { status: 'sent', sentAt: new Date(), messageId, failureReason: null },
    });
  }

  async markFailed(recipientId: string, reason: string): Promise<void> {
    await this.prisma.broadcastRecipient.update({
      where: { id: recipientId },
      data: { status: 'failed', failedAt: new Date(), failureReason: reason },
    });
  }

  async markSkipped(recipientId: string, reason: string): Promise<void> {
    await this.prisma.broadcastRecipient.update({
      where: { id: recipientId },
      data: { status: 'skipped', failureReason: reason },
    });
  }

  /** Return a recipient to the pending pool between retry attempts. */
  async markPendingForRetry(recipientId: string, reason: string): Promise<void> {
    await this.prisma.broadcastRecipient.update({
      where: { id: recipientId },
      data: { status: 'pending', failureReason: reason },
    });
  }

  /** Aggregate recipient counts per status for a broadcast. */
  async statusCounts(broadcastId: string): Promise<StatusCounts> {
    const grouped = await this.prisma.broadcastRecipient.groupBy({
      by: ['status'],
      where: { broadcastId },
      _count: { _all: true },
    });

    const counts: Record<RecipientStatus, number> = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    };
    let total = 0;
    for (const g of grouped) {
      counts[g.status] = g._count._all;
      total += g._count._all;
    }
    return { total, ...counts };
  }
}
