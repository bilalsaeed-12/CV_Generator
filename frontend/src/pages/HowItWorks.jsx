import { useState } from 'react';
import Button from '../components/ui/Button';
import { Alert, Badge, Spinner } from '../components/ui/Feedback';
import { Textarea } from '../components/ui/Field';
import { improveBullet } from '../lib/aiAssist';
import { cx } from '../lib/utils';

const EXAMPLES = [
  'Responsible for maintaining the company website and fixing bugs',
  'I was involved in various projects using React and helped the team',
  'Worked on improving performance of the app',
];

/** The assist, usable without an account. Nothing sells a tool like using it. */
function TryIt() {
  const [text, setText] = useState(EXAMPLES[0]);
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);

  const run = async () => {
    setStatus('loading');
    setErr(null);
    setResult(null);
    try {
      setResult(await improveBullet(text));
      setStatus('ready');
    } catch (e) {
      setErr(e.message);
      setStatus('error');
    }
  };

  return (
    <div className="rounded-xl border border-paper-line bg-white p-5 sm:p-7">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
          Try it on a flat line
        </h3>
        <Badge tone="brass">no account needed</Badge>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={280}
        placeholder="Paste a bullet point from your current resume"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button onClick={run} disabled={status === 'loading' || !text.trim()} variant="brass">
          {status === 'loading' ? (
            <>
              <Spinner className="h-4 w-4" />
              Reading it
            </>
          ) : (
            'Sharpen this line'
          )}
        </Button>
        <span className="text-2xs text-graphite-faint">or start from</span>
        {EXAMPLES.map((ex, i) => (
          <button
            key={ex}
            onClick={() => {
              setText(ex);
              setStatus('idle');
              setResult(null);
            }}
            className="rounded-full border border-paper-line px-2.5 py-1 font-mono text-2xs text-graphite transition-colors hover:border-graphite-faint hover:text-ink"
          >
            example {i + 1}
          </button>
        ))}
      </div>

      {status === 'error' && (
        <Alert tone="rust" title="That did not go through">
          {err} Your text is untouched.
        </Alert>
      )}

      {status === 'ready' && result && (
        <div className="mt-5 space-y-4 border-t border-paper-line pt-5">
          {result.issues.length > 0 && (
            <div>
              <p className="eyebrow mb-2">What is weak here</p>
              <ul className="space-y-1">
                {result.issues.map((i) => (
                  <li key={i.id} className="flex items-start gap-2 text-[13px] text-graphite">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brass" />
                    {i.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="eyebrow mb-2">Three ways to fix it</p>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {result.variants.map((v, i) => (
                <div
                  key={v.id}
                  className="animate-fade-up rounded-lg border border-paper-line bg-paper-sunk/50 p-3.5 transition-colors hover:border-brass/40"
                  style={{ animationDelay: `${i * 80}ms`, animationDuration: '.45s' }}
                >
                  <p className="font-mono text-2xs uppercase tracking-[0.14em] text-brass-deep">
                    {v.label}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink">{v.text}</p>
                  <p className="mt-2 text-2xs text-graphite-faint">{v.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SECTIONS = [
  {
    n: '01',
    title: 'It reads the line before it rewrites it',
    body: 'The assist checks for passive constructions, openings that describe the job rather than your work, hedging words that soften a claim, weak verbs, and the absence of any number at all. Those findings are shown to you before any replacement is offered, so you can disagree.',
  },
  {
    n: '02',
    title: 'It offers three, not one',
    body: 'Impact-first leads with the outcome. Ownership foregrounds what you ran and how big it was. Tightest cuts to the shortest line that still carries evidence. Different jobs reward different emphases, and a single suggestion pretends otherwise.',
  },
  {
    n: '03',
    title: 'It leaves the numbers to you',
    body: 'Where a metric is missing, you get a bracketed placeholder rather than a plausible-sounding figure. Anything on a resume is a claim you will be asked about, and no tool should put a number in your mouth that you cannot back up.',
  },
  {
    n: '04',
    title: 'Nothing changes without a click',
    body: 'Suggestions sit next to your line, never on top of it. If you close the panel, what you wrote is exactly what remains.',
  },
];

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 lg:py-20">
      <header className="max-w-2xl">
        <p className="eyebrow">How the assist works</p>
        <h1 className="mt-3 text-title font-bold text-ink text-balance">
          A second reader, not a ghostwriter
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-graphite text-pretty">
          The assist exists to catch the lines you have read so many times you cannot see them
          anymore. It is deliberately narrow: it will not write your resume, and it will not invent
          anything you did not tell it.
        </p>
      </header>

      <div className="mt-12">
        <TryIt />
      </div>

      <div className="mt-16 space-y-10">
        {SECTIONS.map((s) => (
          <section key={s.n} className="flex flex-col gap-4 sm:flex-row sm:gap-8">
            <span className="shrink-0 font-mono text-sm tabular-nums text-brass-deep">{s.n}</span>
            <div className={cx('border-paper-line sm:border-l sm:pl-8')}>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                {s.title}
              </h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-graphite text-pretty">
                {s.body}
              </p>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16 rounded-xl border border-paper-line bg-white p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
          A note on what this build is
        </h2>
        <p className="mt-2.5 text-[15px] leading-relaxed text-graphite text-pretty">
          This is the frontend of a full stack project. Accounts and documents are held in your
          browser rather than on a server, and the assist runs on a local rules engine instead of a
          hosted model — the interface, the states, and the data shape are all final, so the backend
          slots in behind them without the UI changing.
        </p>
        <Button to="/signup" variant="brass" className="mt-5">
          Start a document
        </Button>
      </div>
    </div>
  );
}
