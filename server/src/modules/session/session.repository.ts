import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { SessionRecord } from './session.types.js';

/**
 * Persistence boundary for session metadata (status, jid, timestamps).
 *
 * Distinct from auth-credential storage (`AuthStateProvider`): this stores the
 * lightweight, human-meaningful record that lets us answer "what happened to
 * this session?" across restarts. Behind an interface so it can move to
 * Postgres/Redis later without changing callers.
 */
export interface SessionRepository {
  find(sessionId: string): Promise<SessionRecord | null>;
  save(record: SessionRecord): Promise<void>;
  delete(sessionId: string): Promise<void>;
  list(): Promise<SessionRecord[]>;
}

/** File-based implementation: one `session.json` per session directory. */
export class FileSessionRepository implements SessionRepository {
  constructor(private readonly baseDir: string) {}

  private file(sessionId: string): string {
    return join(this.baseDir, sessionId, 'session.json');
  }

  async find(sessionId: string): Promise<SessionRecord | null> {
    try {
      const raw = await readFile(this.file(sessionId), 'utf8');
      return JSON.parse(raw) as SessionRecord;
    } catch {
      return null;
    }
  }

  async save(record: SessionRecord): Promise<void> {
    const path = this.file(record.id);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(record, null, 2), 'utf8');
  }

  async delete(sessionId: string): Promise<void> {
    await rm(join(this.baseDir, sessionId), { recursive: true, force: true });
  }

  async list(): Promise<SessionRecord[]> {
    let entries: string[];
    try {
      entries = await readdir(this.baseDir);
    } catch {
      return [];
    }
    const records = await Promise.all(entries.map((id) => this.find(id)));
    return records.filter((r): r is SessionRecord => r !== null);
  }
}
