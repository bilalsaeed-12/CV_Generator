import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { cx } from '../lib/utils';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message, tone = 'neutral', ms = 3600) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), ms);
      return id;
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      toast: (m) => push(m, 'neutral'),
      success: (m) => push(m, 'success'),
      error: (m) => push(m, 'error', 5200),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6 print-hide"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cx(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-pop animate-toast-in',
              t.tone === 'success' && 'border-verdigris/30 bg-verdigris-wash text-verdigris-deep',
              t.tone === 'error' && 'border-rust/25 bg-[#FBEDE8] text-rust',
              t.tone === 'neutral' && 'border-ink-line bg-ink text-paper',
            )}
          >
            <span
              aria-hidden
              className={cx(
                'mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full',
                t.tone === 'success' && 'bg-verdigris',
                t.tone === 'error' && 'bg-rust',
                t.tone === 'neutral' && 'bg-brass',
              )}
            />
            <p className="flex-1 leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="-m-1 rounded p-1 opacity-50 transition hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
