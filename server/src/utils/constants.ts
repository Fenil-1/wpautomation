/**
 * Application-wide constants. Keep magic strings/numbers here so they have a
 * single source of truth.
 */

/** URL prefix under which all API routes are mounted. */
export const API_PREFIX = '/api';

/** Milliseconds. */
export const SECOND = 1_000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;

/** Default timeout for a health-check dependency probe. */
export const HEALTH_PROBE_TIMEOUT_MS = 2 * SECOND;
