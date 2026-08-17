import { useState } from 'react';
import { cx } from '../../lib/utils';

/**
 * A single repeatable entry. Collapsed it shows a one-line summary so a long
 * history stays scannable; expanded it holds the full form. Only the entry you
 * are working on needs to be open.
 */
export default function EntryCard({
  index,
  title,
  subtitle,
  meta,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  defaultOpen = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cx(
        'rounded-lg border bg-white transition-all duration-200',
        open ? 'border-graphite-faint/60 shadow-sm' : 'border-paper-line hover:border-graphite-faint/50',
      )}
    >
      <div className="flex items-center gap-3 px-3.5 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={open}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-paper-line bg-paper-sunk font-mono text-2xs tabular-nums text-graphite-soft">
            {String(index + 1).padStart(2, '0')}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium text-ink">
              {title || <span className="font-normal text-graphite-faint">Untitled entry</span>}
            </span>
            {(subtitle || meta) && (
              <span className="block truncate text-2xs text-graphite-soft">
                {subtitle}
                {subtitle && meta ? ' · ' : ''}
                {meta}
              </span>
            )}
          </span>

          <svg
            width="11"
            height="7"
            viewBox="0 0 11 7"
            className={cx(
              'shrink-0 text-graphite-faint transition-transform duration-200 ease-press',
              open && 'rotate-180',
            )}
            aria-hidden
          >
            <path d="M1 1l4.5 4.5L10 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="rounded p-1.5 text-graphite-faint transition-colors hover:bg-paper-sunk hover:text-ink disabled:pointer-events-none disabled:opacity-25"
            aria-label="Move entry up"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden>
              <path d="M5.5 9V2M2 5.5l3.5-3.5L9 5.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="rounded p-1.5 text-graphite-faint transition-colors hover:bg-paper-sunk hover:text-ink disabled:pointer-events-none disabled:opacity-25"
            aria-label="Move entry down"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden>
              <path d="M5.5 2v7M2 5.5L5.5 9 9 5.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1.5 text-graphite-faint transition-colors hover:bg-rust/10 hover:text-rust"
            aria-label="Delete entry"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden>
              <path d="M1.6 3h7.8M4.4 3V1.8h2.2V3M2.6 3l.4 6.2h5l.4-6.2" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-fade-in border-t border-paper-line px-3.5 py-4">{children}</div>
      )}
    </div>
  );
}
