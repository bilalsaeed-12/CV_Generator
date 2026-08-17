import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../lib/utils';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);

  const trap = useCallback((e) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const nodes = [...panelRef.current.querySelectorAll(FOCUSABLE)];
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    restoreRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      trap(e);
    };
    document.addEventListener('keydown', onKey);

    // Move focus into the dialog on the next frame, once it has painted.
    const id = requestAnimationFrame(() => {
      const target = panelRef.current?.querySelector(FOCUSABLE);
      target?.focus();
    });

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      cancelAnimationFrame(id);
      restoreRef.current?.focus?.();
    };
  }, [open, onClose, trap]);

  if (!open) return null;

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6 print-hide">
      <div
        className="absolute inset-0 animate-fade-in bg-ink/45 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'relative w-full animate-scale-in overflow-hidden rounded-t-2xl border border-paper-line bg-paper shadow-pop sm:rounded-xl',
          sizes[size],
        )}
      >
        {(title || description) && (
          <div className="border-b border-paper-line px-5 py-4 sm:px-6">
            {title && (
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-graphite-soft">{description}</p>
            )}
          </div>
        )}
        <div className="max-h-[65vh] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-paper-line bg-paper-sunk/60 px-5 py-3.5 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
