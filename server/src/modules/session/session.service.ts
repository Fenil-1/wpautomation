import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type ConnectionState,
  type WASocket,
} from 'baileys';
import type { Logger } from 'pino';
import { toDataURL } from 'qrcode';
import { ConflictError, NotFoundError, ServiceUnavailableError } from '../../errors/index.js';
import { nowIso } from '../../utils/date.js';
import type { AuthStateProvider, SessionAuthState } from './auth/auth-state.provider.js';
import type { SessionEventBus } from './session.events.js';
import type { SessionRepository } from './session.repository.js';
import type { QrPayload, SessionSnapshot, SessionStatus } from './session.types.js';

const BASE_RECONNECT_DELAY_MS = 2_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

export interface SessionServiceDeps {
  sessionId: string;
  authProvider: AuthStateProvider;
  repository: SessionRepository;
  events: SessionEventBus;
  logger: Logger;
}

/** Map a Baileys disconnect status code to its human-readable reason name. */
function reasonName(code: number | undefined): string | undefined {
  if (code === undefined) return undefined;
  return (DisconnectReason as Record<number, string>)[code] ?? String(code);
}

/** Extract the Boom status code carried by a Baileys disconnect error. */
function disconnectStatusCode(error: unknown): number | undefined {
  return (error as { output?: { statusCode?: number } } | undefined)?.output?.statusCode;
}

/**
 * Owns the full lifecycle of ONE WhatsApp connection via Baileys.
 *
 * This is the only class in the codebase that imports Baileys. Everything it
 * exposes is plain domain data (`SessionSnapshot`, `QrPayload`) or typed events;
 * raw Baileys/Boom errors never escape — they are translated into the shared
 * `AppError` hierarchy.
 */
export class SessionService {
  private readonly id: string;
  private readonly authProvider: AuthStateProvider;
  private readonly repository: SessionRepository;
  private readonly events: SessionEventBus;
  private readonly logger: Logger;

  private sock: WASocket | null = null;
  private auth: SessionAuthState | null = null;

  private status: SessionStatus = 'idle';
  private qr: string | null = null;
  private jid: string | null = null;
  private connectedAt: string | null = null;
  private lastDisconnectAt: string | null = null;

  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private manualDisconnect = false;
  private opening = false;

  constructor(deps: SessionServiceDeps) {
    this.id = deps.sessionId;
    this.authProvider = deps.authProvider;
    this.repository = deps.repository;
    this.events = deps.events;
    this.logger = deps.logger;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  getSnapshot(): SessionSnapshot {
    return {
      id: this.id,
      status: this.status,
      jid: this.jid,
      phoneNumber: this.phoneNumber(),
      connectedAt: this.connectedAt,
      lastDisconnectAt: this.lastDisconnectAt,
      qrAvailable: this.qr !== null,
    };
  }

  /** Begin (or resume) a connection. Idempotent while already active. */
  async connect(): Promise<SessionSnapshot> {
    return this.openSocket();
  }

  /** Whether the session is connected and able to send. */
  isConnected(): boolean {
    return this.status === 'connected' && this.sock !== null;
  }

  /**
   * Send a plain-text WhatsApp message. This is the ONLY sanctioned way to send
   * — all Baileys/JID details are encapsulated here so no other module imports
   * Baileys. Throws `ServiceUnavailableError` if the session isn't connected.
   */
  async sendText(params: {
    countryCode: string;
    phoneNumber: string;
    text: string;
  }): Promise<{ messageId: string; jid: string }> {
    if (!this.isConnected() || !this.sock) {
      throw new ServiceUnavailableError('WhatsApp session is not connected');
    }
    const jid = SessionService.toJid(params.countryCode, params.phoneNumber);
    const result = await this.sock.sendMessage(jid, { text: params.text });
    return { messageId: result?.key?.id ?? '', jid };
  }

  /** Build a WhatsApp JID from a country code + national number. */
  private static toJid(countryCode: string, phoneNumber: string): string {
    const digits = `${countryCode}${phoneNumber}`.replace(/\D/g, '');
    return `${digits}@s.whatsapp.net`;
  }

  /**
   * Tear down the connection.
   * @param logout when true, log out remotely and delete stored credentials
   *               (next connect will require a fresh QR scan).
   */
  async disconnect({ logout = false }: { logout?: boolean } = {}): Promise<SessionSnapshot> {
    this.manualDisconnect = true;
    this.clearReconnectTimer();

    const sock = this.sock;
    this.sock = null;
    if (sock) {
      try {
        if (logout) await sock.logout();
      } catch (err) {
        this.logger.warn({ err: (err as Error).message }, 'error during remote logout (ignored)');
      }
      try {
        sock.end(undefined);
      } catch {
        // socket may already be closed
      }
    }

    this.qr = null;
    if (logout) {
      await this.auth?.clear();
      this.auth = null;
      this.jid = null;
      this.connectedAt = null;
      this.setStatus('logged_out');
      this.events.emit('logged.out', { sessionId: this.id });
    } else {
      this.setStatus('idle');
    }
    await this.persist();
    return this.getSnapshot();
  }

  /** Current QR as raw string + PNG data URL. Throws if none is available. */
  async getQrPayload(): Promise<QrPayload> {
    if (this.status === 'connected') {
      throw new ConflictError('Session is already connected; no QR code is required.');
    }
    if (!this.qr) {
      throw new NotFoundError(
        'No QR code available. Start the session first with POST /api/session/connect.',
      );
    }
    const dataUrl = await toDataURL(this.qr);
    return { status: this.status, qr: this.qr, dataUrl };
  }

  /**
   * Restore a previously-authenticated session after a process restart.
   * No-op (stays idle) when no saved credentials exist.
   */
  async restore(): Promise<void> {
    if (!(await this.authProvider.exists(this.id))) {
      this.logger.info({ sessionId: this.id }, 'no saved credentials; session remains idle');
      return;
    }
    this.logger.info({ sessionId: this.id }, 'restoring saved session');
    try {
      await this.openSocket();
    } catch (err) {
      this.logger.warn(
        { sessionId: this.id, err: (err as Error).message },
        'failed to restore session on boot',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private async openSocket(): Promise<SessionSnapshot> {
    this.clearReconnectTimer();

    // Idempotency: don't stack sockets while one is already live.
    if (this.opening) return this.getSnapshot();
    if (this.sock && (this.status === 'connected' || this.status === 'qr' || this.status === 'connecting')) {
      return this.getSnapshot();
    }

    this.opening = true;
    this.manualDisconnect = false;
    try {
      this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

      const { version } = await fetchLatestBaileysVersion();
      const auth = this.auth ?? (await this.authProvider.resolve(this.id));
      this.auth = auth;

      const sock = makeWASocket({
        version,
        auth: {
          creds: auth.state.creds,
          keys: makeCacheableSignalKeyStore(auth.state.keys, this.logger),
        },
        browser: Browsers.macOS('Desktop'),
        logger: this.logger,
        syncFullHistory: false,
      });
      this.sock = sock;

      sock.ev.on('creds.update', () => {
        void auth.saveCreds();
      });
      sock.ev.on('connection.update', (update) => {
        void this.onConnectionUpdate(update);
      });

      return this.getSnapshot();
    } catch (err) {
      this.setStatus('idle');
      this.events.emit('error', { sessionId: this.id, error: err as Error });
      throw new ServiceUnavailableError('Failed to start the WhatsApp session.', {
        cause: (err as Error).message,
      });
    } finally {
      this.opening = false;
    }
  }

  private async onConnectionUpdate(update: Partial<ConnectionState>): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      this.qr = qr;
      this.setStatus('qr');
      this.events.emit('qr.updated', { sessionId: this.id, qr });
    }

    if (connection === 'open') {
      await this.onOpen();
    } else if (connection === 'close') {
      await this.onClose(lastDisconnect?.error);
    }
  }

  private async onOpen(): Promise<void> {
    this.qr = null;
    this.reconnectAttempts = 0;
    this.jid = this.sock?.user?.id ?? null;
    this.connectedAt = nowIso();
    this.setStatus('connected');
    this.events.emit('connection.open', { sessionId: this.id, jid: this.jid });
    await this.persist();
  }

  private async onClose(error: unknown): Promise<void> {
    this.lastDisconnectAt = nowIso();
    this.sock = null;

    const statusCode = disconnectStatusCode(error);
    const loggedOut = statusCode === DisconnectReason.loggedOut;
    const willReconnect = !this.manualDisconnect && !loggedOut;

    this.events.emit('connection.close', {
      sessionId: this.id,
      statusCode,
      reason: reasonName(statusCode),
      willReconnect,
    });

    if (loggedOut) {
      await this.handleLoggedOut();
      return;
    }
    if (willReconnect) {
      this.scheduleReconnect();
    } else {
      this.setStatus('idle');
      await this.persist();
    }
  }

  private async handleLoggedOut(): Promise<void> {
    this.qr = null;
    this.jid = null;
    this.connectedAt = null;
    await this.auth?.clear();
    this.auth = null;
    this.setStatus('logged_out');
    this.events.emit('logged.out', { sessionId: this.id });
    await this.persist();
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts += 1;
    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * this.reconnectAttempts,
      MAX_RECONNECT_DELAY_MS,
    );
    this.setStatus('reconnecting');
    this.logger.info(
      { sessionId: this.id, attempt: this.reconnectAttempts, delayMs: delay },
      'scheduling reconnect',
    );
    this.reconnectTimer = setTimeout(() => {
      void this.openSocket();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setStatus(next: SessionStatus): void {
    if (this.status === next) return;
    const previous = this.status;
    this.status = next;
    this.events.emit('status.changed', { sessionId: this.id, previous, current: next });
  }

  private phoneNumber(): string | null {
    if (!this.jid) return null;
    return this.jid.split(/[:@]/)[0] ?? null;
  }

  private async persist(): Promise<void> {
    try {
      await this.repository.save({
        id: this.id,
        status: this.status,
        jid: this.jid,
        phoneNumber: this.phoneNumber(),
        connectedAt: this.connectedAt,
        lastDisconnectAt: this.lastDisconnectAt,
        updatedAt: nowIso(),
      });
    } catch (err) {
      this.logger.warn(
        { sessionId: this.id, err: (err as Error).message },
        'failed to persist session record',
      );
    }
  }
}
