import React, { useEffect, useState } from 'react';
import { X, Loader2, AlertTriangle, Inbox } from 'lucide-react';

// Shared presentational primitives for the Contacts/Groups admin screen.
// All styling uses the existing wa-* theme tokens so the screen feels native
// to the app. Nothing here touches or imports the broadcast UI.

/** Debounce a fast-changing value (e.g. a search box). */
export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Initials for an avatar bubble. */
export function initials(name = '') {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export function Avatar({ name, color }) {
  return (
    <div
      className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-sm text-white select-none"
      style={{ backgroundColor: color || '#00a884' }}
    >
      {initials(name)}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-wa-hover-chat text-wa-text-secondary',
    green: 'bg-wa-green/15 text-wa-green-dark',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-800',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Spinner({ className = 'w-6 h-6' }) {
  return <Loader2 className={`animate-spin text-wa-green ${className}`} />;
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-wa-text-secondary gap-3">
      <Spinner className="w-7 h-7" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="mx-4 my-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-800">
            {error?.code ? `Error · ${error.code}` : 'Something went wrong'}
          </p>
          <p className="text-sm text-red-700">
            {error?.message || 'Failed to load data. Is the backend running?'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-wa-text-secondary gap-3">
      <Inbox className="w-8 h-8 opacity-50" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Modal shell matching the app's BroadcastModal look. */
export function Modal({ title, onClose, children, footer, maxWidth = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl w-full ${maxWidth} flex flex-col max-h-[85vh] shadow-xl overflow-hidden`}>
        <div className="bg-wa-green text-white p-4 flex items-center justify-between shrink-0">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="p-4 border-t border-wa-border bg-gray-50 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function TextField({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-wa-text-secondary uppercase mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export const inputClass =
  'w-full border-b-2 border-wa-border focus:border-wa-green outline-none py-2 text-wa-text-primary text-base transition-colors bg-transparent';

export function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="py-2 px-5 bg-wa-green text-white rounded-xl hover:bg-wa-green-dark transition-colors disabled:opacity-50 disabled:hover:bg-wa-green text-sm font-semibold shadow-sm inline-flex items-center gap-2"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="py-2 px-4 border border-wa-border text-wa-text-secondary rounded-xl hover:bg-wa-hover-chat transition-colors text-sm font-semibold"
    >
      {children}
    </button>
  );
}

/** Prev/next pagination footer. */
export function Pagination({ page, totalPages, total, pageSize, onPage }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-wa-border text-sm text-wa-text-secondary bg-white">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 rounded-lg border border-wa-border hover:bg-wa-hover-chat disabled:opacity-40 font-medium"
        >
          Prev
        </button>
        <span className="px-1">
          Page {page} / {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 rounded-lg border border-wa-border hover:bg-wa-hover-chat disabled:opacity-40 font-medium"
        >
          Next
        </button>
      </div>
    </div>
  );
}
