import { forwardRef, useId, useState } from 'react';
import { cx } from '../../lib/utils';

const control =
  'w-full rounded-md border bg-white px-3 text-sm text-ink placeholder:text-graphite-faint transition-colors duration-150 disabled:bg-paper-sunk disabled:text-graphite-faint';
const ok = 'border-paper-line hover:border-graphite-faint focus:border-brass';
const bad = 'border-rust/60 hover:border-rust focus:border-rust';

export function Field({ label, hint, error, required, htmlFor, children, className }) {
  return (
    <div className={cx('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="flex items-baseline gap-1.5 text-[13px] font-medium text-ink"
        >
          {label}
          {required && (
            <span className="text-rust" aria-hidden>
              *
            </span>
          )}
          {hint && !error && (
            <span className="ml-auto text-2xs font-normal text-graphite-faint">{hint}</span>
          )}
        </label>
      )}
      {children}
      {error && (
        <p className="flex items-start gap-1.5 text-2xs leading-relaxed text-rust" role="alert">
          <svg width="12" height="12" viewBox="0 0 12 12" className="mt-0.5 shrink-0" aria-hidden>
            <circle cx="6" cy="6" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.1" />
            <path d="M6 3.4v3.2M6 8.4v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input({ error, className, ...rest }, ref) {
  return <input ref={ref} className={cx(control, 'h-10', error ? bad : ok, className)} {...rest} />;
});

export const Textarea = forwardRef(function Textarea(
  { error, className, rows = 4, maxLength, value, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        maxLength={maxLength}
        className={cx(control, 'resize-y py-2.5 leading-relaxed', error ? bad : ok, className)}
        {...rest}
      />
      {maxLength && (
        <span
          className={cx(
            'pointer-events-none absolute bottom-2 right-2.5 font-mono text-2xs tabular-nums',
            String(value || '').length > maxLength * 0.92 ? 'text-rust' : 'text-graphite-faint',
          )}
        >
          {String(value || '').length}/{maxLength}
        </span>
      )}
    </div>
  );
});

export const Select = forwardRef(function Select({ error, className, children, ...rest }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cx(control, 'h-10 appearance-none pr-9', error ? bad : ok, className)}
        {...rest}
      >
        {children}
      </select>
      <svg
        width="10"
        height="6"
        viewBox="0 0 10 6"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-graphite-faint"
        aria-hidden
      >
        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
});

export function Switch({ checked, onChange, label, description, id: idProp }) {
  const auto = useId();
  const id = idProp || auto;
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative mt-0.5 h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200 ease-press',
          checked ? 'bg-verdigris' : 'bg-paper-line',
        )}
      >
        <span
          className={cx(
            'absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-press',
            checked ? 'translate-x-[19px]' : 'translate-x-[3px]',
          )}
        />
      </button>
      {(label || description) && (
        <label htmlFor={id} className="cursor-pointer select-none">
          {label && <span className="block text-[13px] font-medium text-ink">{label}</span>}
          {description && (
            <span className="block text-2xs leading-relaxed text-graphite-soft">{description}</span>
          )}
        </label>
      )}
    </div>
  );
}

export function Checkbox({ checked, onChange, label, id: idProp }) {
  const auto = useId();
  const id = idProp || auto;
  return (
    <div className="flex items-center gap-2.5">
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          'flex h-[18px] w-[18px] items-center justify-center rounded border transition-all duration-150',
          checked
            ? 'border-ink bg-ink text-paper'
            : 'border-paper-line bg-white hover:border-graphite-faint',
        )}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
            <path d="M1 4l2.6 2.6L9 1.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      {label && (
        <label htmlFor={id} className="cursor-pointer select-none text-[13px] text-ink">
          {label}
        </label>
      )}
    </div>
  );
}

/**
 * Skills input. Comma or Enter commits a tag; Backspace on an empty field
 * removes the last one, which is the behaviour people already expect.
 */
export function TagInput({ tags = [], onChange, placeholder = 'Type a skill, press Enter' }) {
  const [draft, setDraft] = useState('');

  const add = (raw) => {
    const clean = raw.trim().replace(/,$/, '');
    if (!clean) return;
    if (tags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...tags, clean]);
    setDraft('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div
      className={cx(
        'flex min-h-[80px] flex-wrap content-start gap-2 rounded-md border border-paper-line bg-white p-2.5',
        'transition-colors focus-within:border-brass hover:border-graphite-faint',
      )}
    >
      {tags.map((tag, i) => (
        <span
          key={tag}
          className="group inline-flex animate-scale-in items-center gap-1.5 rounded border border-paper-line bg-paper-sunk py-1 pl-2.5 pr-1.5 text-[13px] text-ink"
          style={{ animationDelay: `${Math.min(i, 12) * 18}ms` }}
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="rounded-sm p-0.5 text-graphite-faint transition-colors hover:bg-rust/10 hover:text-rust"
            aria-label={`Remove ${tag}`}
          >
            <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden>
              <path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
        placeholder={tags.length ? '' : placeholder}
        className="min-w-[140px] flex-1 bg-transparent px-1 text-sm text-ink outline-none placeholder:text-graphite-faint"
        aria-label="Add a skill"
      />
    </div>
  );
}
