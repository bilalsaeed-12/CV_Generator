import { useState } from 'react';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Feedback';
import { cx } from '../lib/utils';

const PLANS = [
  {
    id: 'free',
    name: 'Sheet',
    monthly: 0,
    yearly: 0,
    line: 'Everything you need to send one good resume.',
    features: [
      'One document',
      'All three layouts and every accent',
      '10 assist rewrites a month',
      'A4 PDF export',
      'Public share link',
    ],
    cta: 'Start free',
    to: '/signup',
  },
  {
    id: 'quire',
    name: 'Quire',
    monthly: 6,
    yearly: 54,
    line: 'For an active search, where every application is tailored.',
    features: [
      'Unlimited documents',
      'Unlimited assist rewrites',
      'Tailor a copy per job posting',
      'Version history for 90 days',
      'Custom share address',
      'Remove the Sheaf mark from the footer',
    ],
    cta: 'Choose Quire',
    to: '/signup',
    featured: true,
  },
  {
    id: 'press',
    name: 'Press',
    monthly: 14,
    yearly: 126,
    line: 'For careers advisers running sessions with a cohort.',
    features: [
      'Everything in Quire',
      'Up to 30 seats',
      'Shared layout presets across the cohort',
      'Reviewer comments on any document',
      'Export the whole cohort at once',
    ],
    cta: 'Choose Press',
    to: '/signup',
  },
];

const FAQ = [
  {
    q: 'What happens to my documents if I stop paying?',
    a: 'They stay. You keep read access and PDF export on everything you already wrote; you just go back to editing one document at a time.',
  },
  {
    q: 'Is the assist counted per line or per rewrite?',
    a: 'Per rewrite. One click returns three alternatives and counts once, whether you take one of them or none.',
  },
  {
    q: 'Can I use my own model API key?',
    a: 'On Quire and above, yes. The assist calls your key instead of ours and stops counting against your monthly allowance.',
  },
  {
    q: 'Do you train on what I write?',
    a: 'No. Your documents are yours. The rewrite request is sent, answered, and not retained.',
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const [open, setOpen] = useState(null);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-20">
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Pricing</p>
        <h1 className="mt-3 text-title font-bold text-ink text-balance">
          One good resume costs nothing
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-graphite text-pretty">
          Pay only when you are applying widely enough that tailoring each copy is worth the time.
        </p>

        {/* Billing toggle */}
        <div className="mt-8 inline-flex items-center gap-3">
          <span
            className={cx(
              'text-sm transition-colors',
              !yearly ? 'font-medium text-ink' : 'text-graphite-soft',
            )}
          >
            Monthly
          </span>
          <button
            role="switch"
            aria-checked={yearly}
            aria-label="Bill yearly"
            onClick={() => setYearly((v) => !v)}
            className={cx(
              'relative h-[26px] w-[46px] rounded-full transition-colors duration-200',
              yearly ? 'bg-verdigris' : 'bg-paper-line',
            )}
          >
            <span
              className={cx(
                'absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-press',
                yearly ? 'translate-x-[23px]' : 'translate-x-[3px]',
              )}
            />
          </button>
          <span
            className={cx(
              'flex items-center gap-2 text-sm transition-colors',
              yearly ? 'font-medium text-ink' : 'text-graphite-soft',
            )}
          >
            Yearly
            <Badge tone="verdigris">save 25%</Badge>
          </span>
        </div>
      </header>

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const price = yearly ? plan.yearly : plan.monthly;
          return (
            <div
              key={plan.id}
              className={cx(
                'relative flex flex-col rounded-xl border p-7 transition-all duration-300',
                plan.featured
                  ? 'border-ink bg-ink text-paper shadow-pop lg:-translate-y-3'
                  : 'border-paper-line bg-white hover:-translate-y-1 hover:shadow-lift',
              )}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-7">
                  <Badge tone="brass">most chosen</Badge>
                </span>
              )}

              <h2
                className={cx(
                  'font-display text-xl font-bold tracking-tight',
                  plan.featured ? 'text-paper' : 'text-ink',
                )}
              >
                {plan.name}
              </h2>
              <p
                className={cx(
                  'mt-1.5 text-sm leading-relaxed',
                  plan.featured ? 'text-paper/60' : 'text-graphite-soft',
                )}
              >
                {plan.line}
              </p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span
                  className={cx(
                    'font-display text-4xl font-bold tabular-nums tracking-tight',
                    plan.featured ? 'text-paper' : 'text-ink',
                  )}
                >
                  ${price}
                </span>
                <span
                  className={cx(
                    'font-mono text-2xs uppercase tracking-[0.12em]',
                    plan.featured ? 'text-paper/50' : 'text-graphite-faint',
                  )}
                >
                  {price === 0 ? 'forever' : yearly ? 'per year' : 'per month'}
                </span>
              </div>

              <ul className="mt-7 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm leading-relaxed">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      className={cx('mt-1 shrink-0', plan.featured ? 'text-brass' : 'text-verdigris')}
                      aria-hidden
                    >
                      <path d="M1.5 6.8L4.8 10 11.5 3" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className={plan.featured ? 'text-paper/80' : 'text-graphite'}>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                to={plan.to}
                variant={plan.featured ? 'brass' : 'outline'}
                size="lg"
                className="mt-8 w-full"
              >
                {plan.cta}
              </Button>
            </div>
          );
        })}
      </div>

      <section className="mx-auto mt-20 max-w-2xl">
        <h2 className="text-center font-display text-2xl font-bold tracking-tight text-ink">
          Questions people actually ask
        </h2>
        <div className="mt-8 divide-y divide-paper-line overflow-hidden rounded-xl border border-paper-line bg-white">
          {FAQ.map((item, i) => (
            <div key={item.q}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-paper-sunk/50"
              >
                <span className="flex-1 text-[15px] font-medium text-ink">{item.q}</span>
                <span
                  className={cx(
                    'shrink-0 text-graphite-faint transition-transform duration-200 ease-press',
                    open === i && 'rotate-45',
                  )}
                  aria-hidden
                >
                  <svg width="13" height="13" viewBox="0 0 13 13">
                    <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
              <div
                className={cx(
                  'grid transition-all duration-300 ease-press',
                  open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-[15px] leading-relaxed text-graphite text-pretty">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-2xs leading-relaxed text-graphite-faint">
          Sheaf is a student project. No payment is processed and no plan is real — the toggle,
          the tiers, and the copy are here because a product like this would need them.
        </p>
      </section>
    </div>
  );
}
