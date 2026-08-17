import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import { Badge, Spinner } from '../ui/Feedback';
import { improveBullet } from '../../lib/aiAssist';
import { cx } from '../../lib/utils';

/**
 * AssistPanel
 * -----------------------------------------------------------------------------
 * Opens under the bullet being edited. Three states, each designed rather than
 * defaulted:
 *
 *   loading  — the original line stays visible with a sweep across it, so you
 *              can still read what you wrote while the rewrite is coming.
 *   ready    — three alternatives, each labelled with its editorial priority
 *              and a one-line note on what it changed.
 *   error    — says what happened and offers the retry, never a bare "oops".
 *
 * Nothing is applied without an explicit click. The assist proposes; the person
 * writing the resume decides.
 */
export default function AssistPanel({ open, original, context, onApply, onClose }) {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [picked, setPicked] = useState(null);
  const panelRef = useRef(null);
  const requestId = useRef(0);

  const run = async () => {
    const id = ++requestId.current;
    setStatus('loading');
    setError(null);
    setResult(null);
    setPicked(null);
    try {
      const res = await improveBullet(original, context);
      if (id !== requestId.current) return; // a newer request won
      setResult(res);
      setStatus('ready');
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.message);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (open) run();
    else {
      requestId.current++;
      setStatus('idle');
      setResult(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="mt-2 animate-scale-in overflow-hidden rounded-lg border border-brass/35 bg-brass-wash/45"
      role="region"
      aria-label="Rewrite suggestions"
    >
      <div className="flex items-center gap-2 border-b border-brass/25 px-3.5 py-2.5">
        <svg width="14" height="14" viewBox="0 0 14 14" className="text-brass-deep" aria-hidden>
          <path
            d="M7 1l1.5 3.9L12.4 6.4 8.5 7.9 7 11.8 5.5 7.9 1.6 6.4 5.5 4.9z"
            fill="currentColor"
            opacity=".85"
          />
        </svg>
        <span className="font-mono text-2xs uppercase tracking-[0.16em] text-brass-deep">
          Assist
        </span>

        {status === 'ready' && result && (
          <Badge tone="brass" className="ml-1">
            {result.issues.length ? `${result.issues.length} to fix` : 'reads well'}
          </Badge>
        )}

        <button
          onClick={onClose}
          className="ml-auto rounded p-1 text-brass-deep/60 transition-colors hover:bg-brass/15 hover:text-brass-deep"
          aria-label="Close suggestions"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden>
            <path d="M1 1l9 9M10 1l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="p-3.5">
        {/* ------------------------------ loading ------------------------- */}
        {status === 'loading' && (
          <div>
            <div className="relative overflow-hidden rounded border border-brass/20 bg-white/70 px-3 py-2.5">
              <p className="text-[13px] leading-relaxed text-graphite">{original}</p>
              <div className="pointer-events-none absolute inset-0 shimmer" aria-hidden />
            </div>
            <p className="mt-3 flex items-center gap-2 text-2xs text-brass-deep">
              <Spinner className="h-3 w-3" />
              Reading the line and drafting three alternatives
            </p>
          </div>
        )}

        {/* ------------------------------- error -------------------------- */}
        {status === 'error' && (
          <div>
            <p className="text-[13px] leading-relaxed text-rust">{error}</p>
            <p className="mt-1 text-2xs text-graphite-soft">
              Your text is untouched — nothing was overwritten.
            </p>
            <Button onClick={run} variant="outline" size="sm" className="mt-3">
              Try again
            </Button>
          </div>
        )}

        {/* ------------------------------- ready -------------------------- */}
        {status === 'ready' && result && (
          <div className="space-y-3">
            {result.issues.length > 0 && (
              <div>
                <p className="mb-1.5 font-mono text-2xs uppercase tracking-[0.14em] text-brass-deep/70">
                  What is weak here
                </p>
                <ul className="space-y-1">
                  {result.issues.map((iss) => (
                    <li
                      key={iss.id}
                      className="flex items-start gap-2 text-2xs leading-relaxed text-graphite"
                    >
                      <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-brass-deep/50" />
                      {iss.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              {result.variants.map((v, i) => {
                const isPicked = picked === v.id;
                return (
                  <div
                    key={v.id}
                    className={cx(
                      'animate-fade-up rounded-lg border bg-white transition-all duration-200',
                      isPicked
                        ? 'border-verdigris shadow-sm'
                        : 'border-brass/25 hover:border-brass/50 hover:shadow-sm',
                    )}
                    style={{ animationDelay: `${i * 70}ms`, animationDuration: '.4s' }}
                  >
                    <button
                      type="button"
                      onClick={() => setPicked(isPicked ? null : v.id)}
                      className="w-full px-3 py-2.5 text-left"
                      aria-pressed={isPicked}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-2xs uppercase tracking-[0.14em] text-graphite-soft">
                          {v.label}
                        </span>
                        {isPicked && (
                          <svg width="12" height="12" viewBox="0 0 12 12" className="text-verdigris" aria-hidden>
                            <circle cx="6" cy="6" r="6" fill="currentColor" />
                            <path d="M3.2 6.1l2 2 3.6-4" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink">{v.text}</p>
                      <p className="mt-1 text-2xs text-graphite-faint">{v.note}</p>
                    </button>
                  </div>
                );
              })}
            </div>

            {result.variants.some((v) => /\[X\]|\[N\]/.test(v.text)) && (
              <p className="rounded border border-brass/25 bg-white/60 px-2.5 py-2 text-2xs leading-relaxed text-graphite">
                Square brackets are yours to fill. The assist will not invent a number it cannot
                verify — a made-up metric on a resume is a lie you have to defend in the interview.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <Button
                size="sm"
                variant="brass"
                disabled={!picked}
                onClick={() => {
                  const chosen = result.variants.find((v) => v.id === picked);
                  if (chosen) onApply(chosen.text);
                }}
              >
                {picked ? 'Replace my line' : 'Pick one to replace'}
              </Button>
              <Button size="sm" variant="ghost" onClick={run}>
                Draft three more
              </Button>
              <Button size="sm" variant="quiet" onClick={onClose} className="ml-auto">
                Keep mine
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
