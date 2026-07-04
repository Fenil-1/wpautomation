import type { ApiError, ApiSuccess } from '../types/index.js';

/** Wrap a payload in the standard success envelope. */
export function success<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

/** Wrap an error in the standard error envelope. */
export function failure(code: string, message: string): ApiError {
  return { success: false, error: { code, message } };
}
