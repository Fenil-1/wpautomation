/**
 * Public surface of the session module. Nothing outside this folder should
 * import Baileys or any other session internal directly — only what is
 * re-exported here.
 */
export { sessionManager } from './session.container.js';
export { sessionRoutes } from './session.routes.js';
export { DEFAULT_SESSION_ID } from './session.manager.js';
export type {
  SessionSnapshot,
  SessionStatus,
  SessionRecord,
  QrPayload,
} from './session.types.js';
