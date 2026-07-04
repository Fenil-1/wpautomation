import type { AuthenticationState } from 'baileys';

/**
 * A resolved authentication state for one session: the credential/key material
 * plus the operations Baileys needs to persist and to tear it down.
 */
export interface SessionAuthState {
  /** Credentials + signal key store, in the shape Baileys expects. */
  state: AuthenticationState;
  /** Persist the latest credentials. Wired to Baileys' `creds.update` event. */
  saveCreds: () => Promise<void>;
  /** Permanently remove all stored credentials (e.g. after a remote logout). */
  clear: () => Promise<void>;
}

/**
 * Abstraction over WHERE and HOW auth credentials are stored.
 *
 * The default implementation is file-based (good for local dev). Because
 * `SessionService` depends only on this interface, the storage backend can be
 * swapped later (Postgres, Redis, S3, a secrets manager) without touching the
 * service. This is the single seam the rest of the module is coupled to.
 */
export interface AuthStateProvider {
  /** Load (or initialize) the auth state for a session id. */
  resolve(sessionId: string): Promise<SessionAuthState>;
  /** Whether previously-registered credentials already exist for this session. */
  exists(sessionId: string): Promise<boolean>;
}
