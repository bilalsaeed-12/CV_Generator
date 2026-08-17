import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { cx } from '../../lib/utils';

const LINKS = [
  { to: '/templates', label: 'Templates' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/pricing', label: 'Pricing' },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cx(
        'sticky top-0 z-50 transition-all duration-300 print-hide',
        scrolled
          ? 'border-b border-paper-line bg-paper/85 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cx(
                  'rounded-md px-3 py-2 text-sm transition-colors duration-150',
                  isActive ? 'text-ink' : 'text-graphite hover:bg-paper-sunk hover:text-ink',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <span className="mr-1 text-sm text-graphite-soft">{user.name.split(' ')[0]}</span>
              <Button to="/dashboard" variant="primary" size="sm">
                Open dashboard
              </Button>
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm">
                Sign in
              </Button>
              <Button to="/signup" variant="brass" size="sm">
                Start a document
              </Button>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-md text-ink transition-colors hover:bg-paper-sunk md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <span className="relative block h-3.5 w-5">
            <span
              className={cx(
                'absolute left-0 h-[1.5px] w-5 bg-current transition-all duration-300 ease-press',
                open ? 'top-[6px] rotate-45' : 'top-0',
              )}
            />
            <span
              className={cx(
                'absolute left-0 top-[6px] h-[1.5px] w-5 bg-current transition-all duration-200',
                open && 'opacity-0',
              )}
            />
            <span
              className={cx(
                'absolute left-0 h-[1.5px] w-5 bg-current transition-all duration-300 ease-press',
                open ? 'top-[6px] -rotate-45' : 'top-[12px]',
              )}
            />
          </span>
        </button>
      </div>

      {/* Mobile sheet */}
      <div
        id="mobile-nav"
        className={cx(
          'overflow-hidden border-t border-paper-line bg-paper transition-[max-height,opacity] duration-300 ease-press md:hidden',
          open ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <nav className="flex flex-col gap-1 px-5 py-4" aria-label="Mobile">
          {LINKS.map((l, i) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-3 text-[15px] text-ink transition-colors hover:bg-paper-sunk"
              style={{ animation: open ? `fade-up .35s ${i * 45}ms both` : undefined }}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-paper-line pt-4">
            {user ? (
              <Button to="/dashboard" variant="primary" size="lg">
                Open dashboard
              </Button>
            ) : (
              <>
                <Button to="/login" variant="outline" size="lg">
                  Sign in
                </Button>
                <Button to="/signup" variant="brass" size="lg">
                  Start a document
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
