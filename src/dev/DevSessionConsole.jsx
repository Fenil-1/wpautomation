import { useCallback, useEffect, useRef, useState } from 'react'
import { BACKEND_URL, sessionApi } from './sessionApi.js'

// ---------------------------------------------------------------------------
// Session Debug Console — DEVELOPER-ONLY, TEMPORARY.
//
// Visualizes the complete Baileys session lifecycle for manual verification.
// It only reads the existing /api/session endpoints and never touches the
// production app or any business logic. Status is polled every 2s (no
// WebSockets/SSE) as explicitly scoped for this throwaway page.
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 2000
const MAX_EVENTS = 50

const STATUS_STYLES = {
  idle: { label: 'Idle', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700' },
  connecting: { label: 'Connecting', dot: 'bg-amber-400 animate-pulse', badge: 'bg-amber-100 text-amber-800' },
  qr: { label: 'QR — Scan to Connect', dot: 'bg-blue-500 animate-pulse', badge: 'bg-blue-100 text-blue-800' },
  connected: { label: 'Connected', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800' },
  reconnecting: { label: 'Reconnecting', dot: 'bg-amber-500 animate-pulse', badge: 'bg-amber-100 text-amber-800' },
  logged_out: { label: 'Logged Out', dot: 'bg-red-500', badge: 'bg-red-100 text-red-800' },
}

const EVENT_KIND_STYLES = {
  action: 'text-blue-600',
  success: 'text-emerald-600',
  error: 'text-red-600',
  warn: 'text-amber-600',
  info: 'text-slate-500',
}

function fmt(value) {
  return value === null || value === undefined || value === '' ? '—' : value
}

function fmtTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

// Map an observed status transition to a human-readable lifecycle event.
// Backend events (SessionEventBus) are server-side only, so — per the spec —
// we derive the lifecycle log from observed status changes + local actions.
function transitionToEvent(prev, next) {
  if (next === 'connecting' && prev !== 'reconnecting') return { label: 'Session Started', kind: 'action' }
  if (next === 'qr') return { label: 'QR Generated', kind: 'info' }
  if (next === 'connected') {
    return prev === 'reconnecting'
      ? { label: 'Reconnect Success', kind: 'success' }
      : { label: 'Connected', kind: 'success' }
  }
  if (next === 'reconnecting') return { label: 'Reconnect Started', kind: 'warn' }
  if (next === 'logged_out') return { label: 'Logged Out', kind: 'error' }
  if (next === 'idle' && (prev === 'connected' || prev === 'qr' || prev === 'connecting')) {
    return { label: 'Disconnected', kind: 'warn' }
  }
  return null
}

export default function DevSessionConsole() {
  const [snapshot, setSnapshot] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [qrMessage, setQrMessage] = useState('No QR Available')
  const [error, setError] = useState(null)
  const [events, setEvents] = useState([])
  const [responseMs, setResponseMs] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [busy, setBusy] = useState(false)

  const prevStatusRef = useRef(null)

  const pushEvent = useCallback((label, kind = 'info') => {
    setEvents((prev) =>
      [{ id: crypto.randomUUID(), label, kind, at: new Date().toLocaleTimeString() }, ...prev].slice(
        0,
        MAX_EVENTS,
      ),
    )
  }, [])

  const refreshStatus = useCallback(async () => {
    try {
      const { ok, status, body, elapsedMs } = await sessionApi.getStatus()
      setResponseMs(elapsedMs)
      setLastUpdated(new Date().toLocaleTimeString())

      if (!ok || !body?.success) {
        setError(body?.error ?? { code: `HTTP_${status}`, message: `Request failed (HTTP ${status})` })
        return
      }

      setError(null)
      const data = body.data
      setSnapshot(data)

      const prev = prevStatusRef.current
      if (prev !== data.status) {
        const evt = transitionToEvent(prev, data.status)
        if (evt) pushEvent(evt.label, evt.kind)
        prevStatusRef.current = data.status
      }
    } catch {
      setError({ code: 'NETWORK', message: `Cannot reach backend at ${BACKEND_URL} — is it running?` })
    }
  }, [pushEvent])

  const refreshQr = useCallback(async () => {
    try {
      const { ok, body } = await sessionApi.getQr()
      if (ok && body?.success) {
        setQrDataUrl(body.data.dataUrl)
        setQrMessage(null)
      } else {
        setQrDataUrl(null)
        setQrMessage(body?.error?.message ?? 'No QR Available')
      }
    } catch {
      setQrDataUrl(null)
      setQrMessage('No QR Available')
    }
  }, [])

  // Poll status every 2s.
  useEffect(() => {
    refreshStatus()
    const id = setInterval(refreshStatus, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [refreshStatus])

  // Keep the QR fresh only while awaiting a scan (Baileys rotates it).
  useEffect(() => {
    const status = snapshot?.status
    if (status === 'qr') {
      refreshQr()
      const id = setInterval(refreshQr, POLL_INTERVAL_MS)
      return () => clearInterval(id)
    }
    if (status === 'connected') {
      setQrDataUrl(null)
      setQrMessage(null)
    }
    return undefined
  }, [snapshot?.status, refreshQr])

  const runAction = useCallback(
    async (label, fn, kind = 'action') => {
      setBusy(true)
      pushEvent(label, kind)
      try {
        const { ok, status, body } = await fn()
        if (!ok || !body?.success) {
          const err = body?.error ?? { code: `HTTP_${status}`, message: `Request failed (HTTP ${status})` }
          setError(err)
          pushEvent(`${label} failed: ${err.message}`, 'error')
        } else {
          setError(null)
        }
      } catch (e) {
        setError({ code: 'NETWORK', message: e.message })
        pushEvent(`${label} failed: ${e.message}`, 'error')
      } finally {
        await refreshStatus()
        setBusy(false)
      }
    },
    [pushEvent, refreshStatus],
  )

  const status = snapshot?.status ?? 'idle'
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.idle
  const env = import.meta.env.MODE

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Dev banner */}
      <div className="bg-amber-500 text-amber-950 text-xs font-semibold text-center py-1.5 tracking-wide">
        ⚠ DEVELOPER TOOL — Session Debug Console · not part of the production product
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">WhatsApp Session Debug Console</h1>
            <p className="text-sm text-slate-500">Live view of the Baileys session lifecycle · polling every 2s</p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${statusStyle.badge}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${statusStyle.dot}`} />
            {statusStyle.label}
          </span>
        </header>

        {/* Error alert */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-lg leading-none">✕</span>
              <div>
                <p className="text-sm font-semibold text-red-800">Backend Error · {error.code}</p>
                <p className="text-sm text-red-700">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => runAction('Connect requested', sessionApi.connect)}
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            Connect
          </button>
          <button
            onClick={() => runAction('Disconnect requested', sessionApi.disconnect, 'warn')}
            disabled={busy}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
          >
            Disconnect
          </button>
          <button
            onClick={refreshStatus}
            disabled={busy}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Refresh Status
          </button>
          <button
            onClick={refreshQr}
            disabled={busy}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Refresh QR
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Connection details */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Connection</h2>
            <dl className="space-y-3">
              <Field label="Status" value={statusStyle.label} />
              <Field label="Phone Number" value={fmt(snapshot?.phoneNumber)} mono />
              <Field label="WhatsApp JID" value={fmt(snapshot?.jid)} mono />
              <Field label="Connected Since" value={fmtTime(snapshot?.connectedAt)} />
              <Field label="Last Disconnect" value={fmtTime(snapshot?.lastDisconnectAt)} />
              <Field label="QR Available" value={snapshot?.qrAvailable ? 'Yes' : 'No'} />
            </dl>
          </section>

          {/* QR */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">QR Code</h2>
            <div className="flex min-h-[240px] items-center justify-center rounded-lg bg-slate-50">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="WhatsApp QR code" className="h-56 w-56" />
              ) : (
                <p className="text-sm text-slate-400">{qrMessage ?? 'No QR Available'}</p>
              )}
            </div>
            {qrDataUrl && (
              <p className="mt-3 text-center text-xs text-slate-500">
                Open WhatsApp → Linked Devices → Link a Device, then scan.
              </p>
            )}
          </section>
        </div>

        {/* Event log */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Event Log</h2>
            <button
              onClick={() => setEvents([])}
              className="text-xs font-medium text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          </div>
          {events.length === 0 ? (
            <p className="text-sm text-slate-400">No events yet.</p>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto font-mono text-xs">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="text-slate-400">{e.at}</span>
                  <span className={EVENT_KIND_STYLES[e.kind] ?? 'text-slate-600'}>{e.label}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Developer info */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Developer Info</h2>
          <dl className="grid gap-3 sm:grid-cols-3">
            <Field label="Backend URL" value={BACKEND_URL} mono />
            <Field label="Environment" value={env} mono />
            <Field
              label="API Response Time"
              value={responseMs === null ? '—' : `${responseMs} ms`}
              mono
            />
          </dl>
          <p className="mt-3 text-xs text-slate-400">
            Last updated {lastUpdated ?? '—'} · requests proxied via Vite (/api → backend)
          </p>
        </section>
      </div>
    </div>
  )
}

function Field({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className={`text-sm text-slate-900 ${mono ? 'font-mono' : ''} truncate text-right`}>{value}</dd>
    </div>
  )
}
