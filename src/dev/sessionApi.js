// Thin API client for the dev Session Debug Console.
//
// Requests go to the same origin under /api and are forwarded to the backend by
// the Vite dev proxy (see vite.config.js). This keeps the console free of CORS
// concerns and requires zero backend changes.

export const BACKEND_URL = 'http://localhost:4000' // proxy target (display only)
const API_BASE = '/api'

/**
 * Perform an API request and measure round-trip time.
 * @returns {Promise<{ok: boolean, status: number, body: any, elapsedMs: number}>}
 */
export async function apiRequest(path, options = {}) {
  const started = performance.now()
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...options,
  })
  const elapsedMs = Math.round(performance.now() - started)

  let body = null
  try {
    body = await res.json()
  } catch {
    body = null
  }

  return { ok: res.ok, status: res.status, body, elapsedMs }
}

export const sessionApi = {
  getStatus: () => apiRequest('/session'),
  getQr: () => apiRequest('/session/qr'),
  connect: () => apiRequest('/session/connect', { method: 'POST' }),
  disconnect: () =>
    apiRequest('/session/disconnect', { method: 'POST', body: JSON.stringify({}) }),
}
