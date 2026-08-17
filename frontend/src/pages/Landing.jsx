import { useEffect, useRef, useState } from 'react';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Feedback';
import PagePreview from '../components/preview/PagePreview';
import { sampleResume } from '../lib/templates';
import { cx } from '../lib/utils';

/* -------------------------------------------------------------------------- */
/* Hero demo: the product's one job, performed in front of you.                */
/* A flat line is typed out, diagnosed, then replaced by a sharper one.        */
/* -------------------------------------------------------------------------- */

const WEAK = 'Responsible for helping improve the checkout page and fixing some bugs';
const ISSUES = [
  'Opens by describing the job, not your work',
  'No number, so the impact is unmeasured',
  '"helping" is a weak opening verb',
];
const STRONG =
  'Rebuilt checkout as a controlled multi-step flow, lifting completion from 61% to 78%';

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = (e) => setReduced(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

function SharpenDemo() {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState('typing'); // typing | reading | swapping | done
  const [typed, setTyped] = useState('');
  const timers = useRef([]);

  useEffect(() => {
    // Respect the setting: show the finished comparison, skip the performance.
    if (reduced) {
      setTyped(WEAK);
      setPhase('done');
      return undefined;
    }

    const clear = () => timers.current.forEach(clearTimeout);
    const run = () => {
      clear();
      timers.current = [];
      setTyped('');
      setPhase('typing');

      WEAK.split('').forEach((_, i) => {
        timers.current.push(
          setTimeout(() => setTyped(WEAK.slice(0, i + 1)), 220 + i * 26),
        );
      });

      const typedFor = 220 + WEAK.length * 26;
      timers.current.push(setTimeout(() => setPhase('reading'), typedFor + 450));
      timers.current.push(setTimeout(() => setPhase('swapping'), typedFor + 2100));
      timers.current.push(setTimeout(() => setPhase('done'), typedFor + 2900));
      timers.current.push(setTimeout(run, typedFor + 9500));
    };

    run();
    return clear;
  }, [reduced]);

  return (
    <div className="on-ink relative overflow-hidden rounded-xl border border-ink-line bg-ink-soft shadow-pop">
      <div className="flex items-center gap-2 border-b border-ink-line px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
        </span>
        <span className="ml-1 font-mono text-2xs uppercase tracking-[0.16em] text-paper/40">
          Experience — Northline
        </span>
        <span
          className={cx(
            'ml-auto flex items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.14em] transition-colors duration-300',
            phase === 'done' ? 'text-verdigris' : 'text-brass',
          )}
        >
          <span
            className={cx(
              'h-1.5 w-1.5 rounded-full transition-colors duration-300',
              phase === 'done' ? 'bg-verdigris' : 'bg-brass',
              phase === 'reading' && 'animate-caret-blink',
            )}
          />
          {phase === 'typing' && 'writing'}
          {phase === 'reading' && 'reading the line'}
          {phase === 'swapping' && 'replacing'}
          {phase === 'done' && 'sharpened'}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        {/* The line being worked on */}
        <div
          className={cx(
            'relative min-h-[76px] rounded-lg border px-3.5 py-3 transition-all duration-500',
            phase === 'done'
              ? 'border-verdigris/40 bg-verdigris/[.07]'
              : 'border-white/10 bg-white/[.04]',
          )}
        >
          {phase !== 'done' && (
            <p className="text-[14px] leading-relaxed text-paper/80">
              {typed}
              {phase === 'typing' && (
                <span className="ml-px inline-block h-[15px] w-[2px] translate-y-[2px] animate-caret-blink bg-brass" />
              )}
            </p>
          )}

          {phase === 'done' && (
            <p className="animate-fade-up text-[14px] leading-relaxed text-paper">{STRONG}</p>
          )}

          {phase === 'swapping' && (
            <div className="pointer-events-none absolute inset-0 rounded-lg shimmer" aria-hidden />
          )}
        </div>

        {/* Diagnosis */}
        <div
          className={cx(
            'grid transition-all duration-500 ease-press',
            phase === 'reading' || phase === 'swapping'
              ? 'mt-3 grid-rows-[1fr] opacity-100'
              : 'mt-0 grid-rows-[0fr] opacity-0',
          )}
        >
          <ul className="overflow-hidden">
            {ISSUES.map((issue, i) => (
              <li
                key={issue}
                className="flex items-start gap-2 py-[3px] text-2xs leading-relaxed text-brass"
                style={{
                  animation:
                    phase === 'reading' ? `fade-up .4s ${i * 130}ms both` : undefined,
                }}
              >
                <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-brass/70" />
                {issue}
              </li>
            ))}
          </ul>
        </div>

        {phase === 'done' && (
          <p className="mt-3 animate-fade-in text-2xs leading-relaxed text-paper/45">
            Three alternatives were offered. This one was chosen — nothing is replaced without a
            click.
          </p>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const FEATURES = [
  {
    title: 'The page is never hidden',
    body: 'No preview button, no separate tab. The finished A4 sheet sits beside the form and re-typesets on every keystroke, so you always know what you are actually sending.',
  },
  {
    title: 'It tells you which lines are weak',
    body: 'Each bullet gets a strength reading based on real problems — passive voice, duty-verb openings, hedging, and missing numbers. The gauge is honest, not encouraging.',
  },
  {
    title: 'Three rewrites, never one',
    body: 'Impact-first, ownership-first, and tightest. You pick. A single suggestion is a demand; three is a choice.',
  },
  {
    title: 'It will not invent your numbers',
    body: 'Where a metric is missing you get a bracketed placeholder to fill in yourself. A made-up figure is something you have to defend in the interview.',
  },
];

const STEPS = [
  { n: '01', title: 'Answer the questions', body: 'Seven short steps. Nothing asks for a cover letter or a photograph.' },
  { n: '02', title: 'Sharpen what reads flat', body: 'Run the assist on any line that is doing less work than the ones around it.' },
  { n: '03', title: 'Set it and send it', body: 'Pick a layout and an ink, then export a real A4 PDF or share a link.' },
];

export default function Landing() {
  const [demoResume] = useState(() => sampleResume());

  return (
    <>
      {/* ------------------------------- hero ---------------------------- */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 drafting-grid opacity-70" aria-hidden />
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-[0.13] blur-3xl"
          style={{ background: 'radial-gradient(circle, #E8A33D 0%, transparent 68%)' }}
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-20">
          <div className="animate-fade-up">
            <Badge tone="brass">Resume &amp; portfolio builder</Badge>

            <h1 className="mt-5 text-display font-bold text-ink">
              Your career,
              <br />
              <span className="relative inline-block">
                properly typeset
                <span
                  className="absolute -bottom-1 left-0 h-[6px] w-full origin-left animate-rule-draw rounded-full bg-brass/45"
                  style={{ animationDelay: '.5s' }}
                  aria-hidden
                />
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-graphite text-pretty">
              Most resume tools hide the document behind a preview button and let you ship a page
              you have never actually read. Sheaf keeps the sheet in front of you and points at the
              lines doing the least work.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button to="/signup" variant="brass" size="lg">
                Start a document
              </Button>
              <Button to="/templates" variant="outline" size="lg">
                See the layouts
              </Button>
            </div>

            <p className="mt-5 font-mono text-2xs uppercase tracking-[0.14em] text-graphite-faint">
              Free while it is a student project · No card, no trial clock
            </p>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '.15s' }}>
            <SharpenDemo />
          </div>
        </div>
      </section>

      {/* ---------------------------- features --------------------------- */}
      <section className="border-t border-paper-line bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="max-w-2xl">
            <p className="eyebrow">What it actually does</p>
            <h2 className="mt-3 text-title font-bold text-ink text-balance">
              Four decisions that make the difference
            </h2>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-paper-line bg-paper-line sm:grid-cols-2">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="group bg-white p-7 transition-colors duration-300 hover:bg-paper-sunk/40 lg:p-9"
              >
                <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                  {f.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-graphite text-pretty">
                  {f.body}
                </p>
                <span
                  className="mt-5 block h-px w-10 origin-left bg-brass transition-transform duration-500 ease-press group-hover:scale-x-[3.5]"
                  aria-hidden
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------- process --------------------------- */}
      <section className="border-t border-paper-line">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow">Three moves</p>
              <h2 className="mt-3 text-title font-bold text-ink text-balance">
                About twenty minutes, start to sent
              </h2>

              {/* Numbered because this genuinely is a sequence. */}
              <ol className="mt-10 space-y-8">
                {STEPS.map((s) => (
                  <li key={s.n} className="flex gap-5">
                    <span className="font-mono text-sm tabular-nums text-brass-deep">{s.n}</span>
                    <div className="border-l border-paper-line pl-5">
                      <h3 className="font-display text-base font-semibold tracking-tight text-ink">
                        {s.title}
                      </h3>
                      <p className="mt-1 text-[15px] leading-relaxed text-graphite">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-xl border border-paper-line bg-paper-sunk p-6 drafting-grid sm:p-10">
              <PagePreview resume={demoResume} maxScale={0.82} />
              <p className="mt-4 text-center text-2xs text-graphite-faint">
                A finished document, set in Folio with a brass accent
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------- cta ----------------------------- */}
      <section className="on-ink border-t border-ink-line bg-ink text-paper">
        <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 lg:py-28">
          <div className="pointer-events-none absolute inset-0 drafting-grid-dark" aria-hidden />
          <div className="relative">
            <h2 className="text-title font-bold text-balance">
              Write it once. Read it properly. Send it.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-paper/60 text-pretty">
              Start with a blank sheet or the worked example, and change the parts that are not
              yours.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button to="/signup" variant="brass" size="lg">
                Create an account
              </Button>
              <Button to="/how-it-works" variant="onInk" size="lg">
                How it works
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
