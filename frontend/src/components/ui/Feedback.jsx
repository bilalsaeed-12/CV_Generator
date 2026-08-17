import { cx } from '../../lib/utils';

export function Spinner({ className }) {
  return (
    <svg
      className={cx('animate-spin', className || 'h-4 w-4')}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity=".22" strokeWidth="2" />
      <path
        d="M14.5 8A6.5 6.5 0 0 0 8 1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Skeleton({ className }) {
  return <div className={cx('skeleton', className)} aria-hidden />;
}

/** Loading placeholder shaped like the thing that's coming, not a generic bar. */
export function DocumentSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border border-paper-line bg-white p-5" aria-hidden>
      <Skeleton className="h-5 w-2/5" />
      <Skeleton className="h-3 w-1/4" />
      <div className="pt-3 space-y-2">
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-[92%]" />
        <Skeleton className="h-2.5 w-3/4" />
      </div>
    </div>
  );
}

export function Badge({ tone = 'neutral', children, className }) {
  const tones = {
    neutral: 'bg-paper-sunk text-graphite border-paper-line',
    brass: 'bg-brass-wash text-brass-deep border-brass/30',
    verdigris: 'bg-verdigris-wash text-verdigris-deep border-verdigris/25',
    ink: 'bg-ink text-paper border-ink',
    rust: 'bg-[#FBEDE8] text-rust border-rust/25',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-2xs uppercase tracking-[0.12em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Empty states are instructions, not apologies. Each one names the thing that
 * isn't there and gives the single action that fixes it.
 */
export function EmptyState({ icon, title, body, action, className }) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-paper-line bg-paper-sunk/50 px-6 py-14 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-paper-line bg-white text-graphite-faint shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-graphite-soft">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ProgressRing({ value = 0, size = 44, stroke = 3.5, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity=".14" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.2,.8,.3,1)' }}
        />
      </svg>
      <span className="absolute font-mono text-2xs font-medium tabular-nums">
        {label ?? `${Math.round(value)}`}
      </span>
    </div>
  );
}

export function Alert({ tone = 'neutral', title, children }) {
  const tones = {
    neutral: 'border-paper-line bg-paper-sunk text-graphite',
    brass: 'border-brass/30 bg-brass-wash text-brass-deep',
    rust: 'border-rust/25 bg-[#FBEDE8] text-rust',
    verdigris: 'border-verdigris/25 bg-verdigris-wash text-verdigris-deep',
  };
  return (
    <div className={cx('rounded-lg border px-4 py-3 text-sm leading-relaxed', tones[tone])} role="alert">
      {title && <p className="mb-0.5 font-semibold">{title}</p>}
      {children}
    </div>
  );
}
