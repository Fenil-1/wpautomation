import type { Logger } from 'pino';
import type { AuthStateProvider } from './auth/auth-state.provider.js';
import type { SessionEventBus } from './session.events.js';
import type { SessionRepository } from './session.repository.js';
import { SessionService } from './session.service.js';

/** The single session id used in Stage 1. Multi-session is a future stage. */
export const DEFAULT_SESSION_ID = 'default';

export interface SessionManagerDeps {
  authProvider: AuthStateProvider;
  repository: SessionRepository;
  events: SessionEventBus;
  logger: Logger;
}

/**
 * Owns the set of live `SessionService` instances, keyed by session id.
 *
 * Today it manages exactly one session (`DEFAULT_SESSION_ID`). It exists now,
 * ahead of need, so that supporting multiple WhatsApp accounts later is purely
 * additive — the routes, service, and persistence layers won't have to change,
 * they'll just address sessions by a different id. Callers go through the
 * manager, never `new SessionService()` directly.
 */
export class SessionManager {
  private readonly services = new Map<string, SessionService>();

  constructor(private readonly deps: SessionManagerDeps) {}

  /** Get the existing service for an id, creating it lazily if absent. */
  getOrCreate(sessionId: string = DEFAULT_SESSION_ID): SessionService {
    let service = this.services.get(sessionId);
    if (!service) {
      service = new SessionService({
        sessionId,
        authProvider: this.deps.authProvider,
        repository: this.deps.repository,
        events: this.deps.events,
        logger: this.deps.logger.child({ sessionId }),
      });
      this.services.set(sessionId, service);
    }
    return service;
  }

  /** Convenience accessor for the single Stage 1 session. */
  getDefault(): SessionService {
    return this.getOrCreate(DEFAULT_SESSION_ID);
  }

  /** Restore any previously-authenticated sessions after a process restart. */
  async restore(): Promise<void> {
    await this.getDefault().restore();
  }

  /** Cleanly disconnect all sessions (without logging out) on shutdown. */
  async shutdown(): Promise<void> {
    for (const service of this.services.values()) {
      await service.disconnect({ logout: false });
    }
  }
}
