import { access, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { useMultiFileAuthState } from 'baileys';
import type { AuthStateProvider, SessionAuthState } from './auth-state.provider.js';

/**
 * File-based auth storage for local development.
 *
 * Delegates to Baileys' `useMultiFileAuthState`, which writes `creds.json` plus
 * one file per signal key under `<baseDir>/<sessionId>/auth`. We wrap it so the
 * rest of the module talks only to the `AuthStateProvider` interface.
 */
export class FileAuthStateProvider implements AuthStateProvider {
  constructor(private readonly baseDir: string) {}

  private authDir(sessionId: string): string {
    return join(this.baseDir, sessionId, 'auth');
  }

  async resolve(sessionId: string): Promise<SessionAuthState> {
    const dir = this.authDir(sessionId);
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    return {
      state,
      saveCreds,
      clear: async () => {
        await rm(dir, { recursive: true, force: true });
      },
    };
  }

  async exists(sessionId: string): Promise<boolean> {
    try {
      await access(join(this.authDir(sessionId), 'creds.json'));
      return true;
    } catch {
      return false;
    }
  }
}
