/**
 * Shared, framework-agnostic types used across the backend.
 */

/** Status of a single external dependency probed by the health check. */
export type DependencyStatus = 'up' | 'down';

/** Result of probing one dependency. */
export interface DependencyHealth {
  status: DependencyStatus;
  /** Round-trip latency of the probe, in milliseconds. */
  latencyMs?: number;
  /** Present only when `status === 'down'`. */
  error?: string;
}

/** Overall service health, returned by `GET /api/health`. */
export interface HealthReport {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  environment: string;
  /** Process uptime in seconds. */
  uptimeSeconds: number;
  timestamp: string;
  dependencies: {
    database: DependencyHealth;
    redis: DependencyHealth;
  };
}

/** Standard success envelope for API responses. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/** Standard error envelope for API responses. */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
