import { randomUUID } from 'node:crypto';

/** Generate a random UUID v4. */
export function uuid(): string {
  return randomUUID();
}

/**
 * Generate a short, url-safe correlation id (e.g. for request tracing).
 * Not cryptographically meaningful — for readability in logs only.
 */
export function shortId(length = 12): string {
  return randomUUID().replace(/-/g, '').slice(0, length);
}
