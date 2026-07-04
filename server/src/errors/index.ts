/**
 * Reusable, typed error classes.
 *
 * Every expected/handled failure should be represented by an `AppError`
 * subclass. This lets the central error handler map errors to consistent HTTP
 * responses and lets us distinguish *operational* errors (bad input, missing
 * record) from *programmer* errors (bugs) — the latter are non-operational and
 * should be treated as `500`s and alerted on.
 */
export abstract class AppError extends Error {
  /** HTTP status code to return for this error. */
  public abstract readonly statusCode: number;
  /** Stable, machine-readable error code (e.g. `NOT_FOUND`). */
  public abstract readonly code: string;
  /**
   * Whether this is an expected, handled condition (`true`) vs. an unexpected
   * bug (`false`). Non-operational errors should never leak details to clients.
   */
  public readonly isOperational: boolean = true;
  /** Optional structured context for logging (never sent to clients). */
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/** 400 — request failed validation. */
export class ValidationError extends AppError {
  public readonly statusCode = 400;
  public readonly code = 'VALIDATION_ERROR';
}

/** 404 — requested resource does not exist. */
export class NotFoundError extends AppError {
  public readonly statusCode = 404;
  public readonly code = 'NOT_FOUND';
}

/** 409 — request conflicts with current state (e.g. duplicate). */
export class ConflictError extends AppError {
  public readonly statusCode = 409;
  public readonly code = 'CONFLICT';
}

/** 401 — authentication required or failed. */
export class UnauthorizedError extends AppError {
  public readonly statusCode = 401;
  public readonly code = 'UNAUTHORIZED';
}

/** 403 — authenticated but not permitted. */
export class ForbiddenError extends AppError {
  public readonly statusCode = 403;
  public readonly code = 'FORBIDDEN';
}

/** 500 — a database operation failed unexpectedly. */
export class DatabaseError extends AppError {
  public readonly statusCode = 500;
  public readonly code = 'DATABASE_ERROR';
  public override readonly isOperational = false;
}

/** 503 — an upstream/external dependency is unavailable (e.g. WhatsApp socket). */
export class ServiceUnavailableError extends AppError {
  public readonly statusCode = 503;
  public readonly code = 'SERVICE_UNAVAILABLE';
}

/** Narrowing helper for the error handler. */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
