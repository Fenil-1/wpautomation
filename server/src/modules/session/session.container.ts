import { config } from '../../config/index.js';
import { createLogger } from '../../lib/logger.js';
import { FileAuthStateProvider } from './auth/file-auth-state.provider.js';
import { attachSessionLogging, SessionEventBus } from './session.events.js';
import { SessionManager } from './session.manager.js';
import { FileSessionRepository } from './session.repository.js';

/**
 * Composition root for the session module — wires concrete implementations to
 * their interfaces exactly once. Swapping the file-based backends for other
 * storage later happens here and nowhere else.
 *
 * Lives in its own file (not the barrel) to avoid an import cycle with routes.
 */
const logger = createLogger({ module: 'session' });

const events = new SessionEventBus();
attachSessionLogging(events, logger);

export const sessionManager = new SessionManager({
  authProvider: new FileAuthStateProvider(config.storage.sessionsDir),
  repository: new FileSessionRepository(config.storage.sessionsDir),
  events,
  logger,
});
