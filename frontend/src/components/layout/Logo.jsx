import { Link } from 'react-router-dom';
import { cx } from '../../lib/utils';

/** Three stacked sheets, slightly fanned — a sheaf. */
export function Mark({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cx('h-6 w-6', className)} aria-hidden>
      <rect x="3" y="6" width="12" height="15" rx="1.5" fill="currentColor" opacity=".22" />
      <rect x="6" y="4.5" width="12" height="15" rx="1.5" fill="currentColor" opacity=".45" />
      <rect
        x="9"
        y="3"
        width="12"
        height="15"
        rx="1.5"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M11.6 7.4h6.8M11.6 10.2h6.8M11.6 13h4" stroke="#FBFAF7" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ to = '/', className, tone = 'ink' }) {
  return (
    <Link
      to={to}
      className={cx(
        'group inline-flex items-center gap-2.5 rounded transition-opacity hover:opacity-80',
        className,
      )}
      aria-label="Sheaf, home"
    >
      <Mark className={tone === 'paper' ? 'text-brass' : 'text-ink'} />
      <span
        className={cx(
          'font-display text-[19px] font-bold tracking-[-0.03em]',
          tone === 'paper' ? 'text-paper' : 'text-ink',
        )}
      >
        Sheaf
      </span>
    </Link>
  );
}
