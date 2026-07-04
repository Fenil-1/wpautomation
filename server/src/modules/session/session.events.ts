import { EventEmitter } from 'node:events';
import type { Logger } from 'pino';
import type { SessionStatus } from './session.types.js';

/**
 * Strongly-typed map of session lifecycle events and their payloads.
 * Adding an event here forces every emit/listener to stay type-correct.
 */
export interface SessionEventMap {
  'status.changed': { sessionId: string; previous: SessionStatus; current: SessionStatus };
  'qr.updated': { sessionId: string; qr: string };
  'connection.open': { sessionId: string; jid: string | null };
  'connection.close': {
    sessionId: string;
    statusCode: number | undefined;
    reason: string | undefined;
    willReconnect: boolean;
  };
  'logged.out': { sessionId: string };
  'error': { sessionId: string; error: Error };
}

type SessionEventListener<K extends keyof SessionEventMap> = (
  payload: SessionEventMap[K],
) => void;

/**
 * A thin, typed wrapper over Node's EventEmitter for session lifecycle events.
 * `SessionService` is the sole emitter; subscribers (logging today, metrics or
 * webhooks tomorrow) attach here without the service knowing about them.
 */
export class SessionEventBus {
  private readonly emitter = new EventEmitter();

  on<K extends keyof SessionEventMap>(event: K, listener: SessionEventListener<K>): this {
    this.emitter.on(event, listener as (payload: unknown) => void);
    return this;
  }

  emit<K extends keyof SessionEventMap>(event: K, payload: SessionEventMap[K]): void {
    this.emitter.emit(event, payload);
  }
}

/**
 * Attach the logging subscriber. Every lifecycle event is logged — this is the
 * module's fulfilment of the "log every lifecycle event" requirement, kept out
 * of the service itself so logging can evolve independently.
 */
export function attachSessionLogging(bus: SessionEventBus, logger: Logger): void {
  bus.on('status.changed', ({ sessionId, previous, current }) =>
    logger.info({ sessionId, previous, current }, 'session status changed'),
  );
  bus.on('qr.updated', ({ sessionId }) =>
    logger.info({ sessionId }, 'session QR code updated (awaiting scan)'),
  );
  bus.on('connection.open', ({ sessionId, jid }) =>
    logger.info({ sessionId, jid }, 'session connected'),
  );
  bus.on('connection.close', ({ sessionId, statusCode, reason, willReconnect }) =>
    logger.warn({ sessionId, statusCode, reason, willReconnect }, 'session connection closed'),
  );
  bus.on('logged.out', ({ sessionId }) =>
    logger.warn({ sessionId }, 'session logged out — credentials cleared'),
  );
  bus.on('error', ({ sessionId, error }) =>
    logger.error({ sessionId, err: error.message }, 'session error'),
  );
}
