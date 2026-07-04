/**
 * Domain types for the WhatsApp session module.
 *
 * These are framework-agnostic and Baileys-agnostic on purpose: nothing outside
 * this module should need to know that Baileys exists.
 */

/** Lifecycle status of a single WhatsApp session. */
export type SessionStatus =
  | 'idle' // never started, or cleanly disconnected — credentials may still exist
  | 'connecting' // socket opening, first connection attempt
  | 'qr' // waiting for the user to scan a QR code
  | 'connected' // authenticated and online
  | 'reconnecting' // dropped unexpectedly, retrying with backoff
  | 'logged_out'; // remote logout / 401 — credentials cleared, needs a fresh QR

/** Persisted, restart-surviving snapshot of a session. */
export interface SessionRecord {
  id: string;
  status: SessionStatus;
  jid: string | null;
  phoneNumber: string | null;
  connectedAt: string | null;
  lastDisconnectAt: string | null;
  updatedAt: string;
}

/** Live, read-only view of a session returned by the API. */
export interface SessionSnapshot {
  id: string;
  status: SessionStatus;
  jid: string | null;
  phoneNumber: string | null;
  connectedAt: string | null;
  lastDisconnectAt: string | null;
  /** Whether a QR code is currently available to scan. */
  qrAvailable: boolean;
}

/** Payload returned by GET /api/session/qr. */
export interface QrPayload {
  status: SessionStatus;
  /** Raw QR string emitted by Baileys (encode client-side if preferred). */
  qr: string;
  /** Ready-to-render PNG data URL of the same QR. */
  dataUrl: string;
}
