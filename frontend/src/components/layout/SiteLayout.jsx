import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import Logo from './Logo';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { to: '/templates', label: 'Templates' },
      { to: '/how-it-works', label: 'How it works' },
      { to: '/pricing', label: 'Pricing' },
      { to: '/dashboard', label: 'Your documents' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/signup', label: 'Create an account' },
      { to: '/login', label: 'Sign in' },
      { to: '/settings', label: 'Settings' },
    ],
  },
];

/** Every route change starts at the top of the page. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname]);
  return null;
}

export default function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="on-ink mt-24 border-t border-ink-line bg-ink text-paper print-hide">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Logo tone="paper" />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/55">
                A guided builder that keeps the finished page in front of you the whole time, and an
                assist that sharpens the lines doing the least work.
              </p>
            </div>

            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="font-mono text-2xs uppercase tracking-[0.18em] text-paper/40">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.to}>
                      <Link
                        to={l.to}
                        className="link-underline text-sm text-paper/70 transition-colors hover:text-paper"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-ink-line pt-6 text-2xs text-paper/40 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono uppercase tracking-[0.16em]">
              Sheaf — a student project, not a real company
            </p>
            <p>Set in Bricolage Grotesque, Public Sans, and Source Serif 4.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
