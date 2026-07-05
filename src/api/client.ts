// Base HTTP client for the wa-broadcast backend.
//
// Requests hit the same origin under /api and are forwarded to the Fastify
// backend by the Vite dev proxy (see vite.config.js) — no CORS, no backend
// change. The backend wraps every response in { success, data } / { success,
// error }; this client unwraps `data` on success and throws `ApiError`
// otherwise, so callers deal in plain domain objects.

const BASE_URL =
  (import.meta.env && import.meta.env.VITE_API_BASE_URL) || '/api';

/** Error thrown for any non-2xx response or backend error envelope. */
export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

function toQueryString(query?: QueryParams): string {
  if (!query) return '';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

interface RequestOptions {
  body?: unknown;
  query?: QueryParams;
  signal?: AbortSignal;
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, query, signal } = options;
  const hasBody = body !== undefined;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}${toQueryString(query)}`, {
      method,
      headers: hasBody ? { 'content-type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    // Network / connection failure (backend down, etc.)
    throw new ApiError(0, 'NETWORK', (err as Error).message || 'Network error');
  }

  if (res.status === 204) return undefined as T;

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  const envelope = json as
    | { success: true; data: T }
    | { success: false; error: { code: string; message: string } }
    | null;

  if (!res.ok || !envelope || envelope.success === false) {
    const error =
      envelope && envelope.success === false
        ? envelope.error
        : { code: `HTTP_${res.status}`, message: `Request failed (HTTP ${res.status})` };
    throw new ApiError(res.status, error.code, error.message);
  }

  return envelope.data;
}

export const apiClient = {
  get: <T>(path: string, query?: QueryParams, signal?: AbortSignal) =>
    request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  del: <T>(path: string) => request<T>('DELETE', path),
};
