/** Current timestamp as an ISO-8601 string. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Process uptime in whole seconds. */
export function uptimeSeconds(): number {
  return Math.floor(process.uptime());
}
