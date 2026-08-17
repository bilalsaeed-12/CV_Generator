import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../../lib/utils';
import { Spinner } from './Feedback';

const base =
  'relative inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200 ease-press disabled:pointer-events-none disabled:opacity-45 select-none whitespace-nowrap';

const variants = {
  primary:
    'bg-ink text-paper shadow-inset hover:bg-ink-soft hover:-translate-y-px hover:shadow-lift active:translate-y-0 active:shadow-none',
  brass:
    'bg-brass text-ink shadow-inset hover:bg-brass-deep hover:text-paper hover:-translate-y-px hover:shadow-lift active:translate-y-0 active:shadow-none',
  outline:
    'border border-paper-line bg-paper text-ink hover:border-ink/35 hover:bg-paper-sunk active:bg-paper-line/60',
  ghost: 'text-graphite hover:bg-paper-sunk hover:text-ink active:bg-paper-line/60',
  quiet: 'text-graphite-soft hover:text-ink underline-offset-4 hover:underline',
  danger: 'bg-rust text-white hover:bg-[#A8431F] hover:-translate-y-px active:translate-y-0',
  onInk:
    'border border-white/15 bg-white/[.06] text-paper hover:bg-white/[.12] hover:border-white/25 active:bg-white/[.08]',
};

const sizes = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
  icon: 'h-9 w-9',
};

export const Button = forwardRef(function Button(
  {
    as,
    to,
    href,
    variant = 'primary',
    size = 'md',
    loading = false,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  const cls = cx(base, variants[variant], sizes[size], className);
  const inner = (
    <>
      {loading && <Spinner className="h-4 w-4" />}
      <span className={cx('inline-flex items-center gap-2', loading && 'opacity-80')}>
        {children}
      </span>
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={cls} {...rest}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={cls} {...rest}>
        {inner}
      </a>
    );
  }

  const Tag = as || 'button';
  return (
    <Tag ref={ref} className={cls} disabled={disabled || loading} {...rest}>
      {inner}
    </Tag>
  );
});

export default Button;
