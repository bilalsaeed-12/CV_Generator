import { useState } from 'react';
import Button from '../../ui/Button';
import { Switch } from '../../ui/Field';
import { Alert, Badge, ProgressRing } from '../../ui/Feedback';
import { useToast } from '../../../context/ToastContext';
import { completeness, copyText, cx, downloadJSON, estimateLines } from '../../../lib/utils';

export default function StepReview({ resume, patch, onGoToStep }) {
  const { success, error } = useToast();
  const [copied, setCopied] = useState(false);
  const { percent, checks } = completeness(resume);
  const lines = estimateLines(resume);
  const overflowing = lines > 46;

  const shareUrl = `${window.location.origin}/r/${resume.slug}`;

  const stepForCheck = {
    name: 0, contact: 0, summary: 0, exp: 1, bullets: 1, edu: 2, skills: 3, proj: 4,
  };

  const doCopy = async () => {
    const ok = await copyText(shareUrl);
    if (ok) {
      setCopied(true);
      success('Link copied. Anyone with it can read the page.');
      setTimeout(() => setCopied(false), 2200);
    } else {
      error('The link could not be copied. Select it and copy manually.');
    }
  };

  return (
    <div className="space-y-6">
      {/* --------------------------- readiness ---------------------------- */}
      <section className="rounded-lg border border-paper-line bg-white p-4">
        <div className="flex items-center gap-4">
          <span className={cx(percent === 100 ? 'text-verdigris' : 'text-brass')}>
            <ProgressRing value={percent} size={52} label={`${percent}%`} />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold tracking-tight text-ink">
              {percent === 100 ? 'Ready to send' : 'Almost there'}
            </h3>
            <p className="text-2xs leading-relaxed text-graphite-soft">
              {percent === 100
                ? 'Every section a reader expects is filled in.'
                : 'The unchecked items below are the ones a recruiter notices missing.'}
            </p>
          </div>
        </div>

        <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
          {checks.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => !c.done && onGoToStep(stepForCheck[c.id] ?? 0)}
                disabled={c.done}
                className={cx(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors',
                  c.done
                    ? 'cursor-default text-graphite-soft'
                    : 'text-ink hover:bg-paper-sunk',
                )}
              >
                <span
                  className={cx(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                    c.done ? 'bg-verdigris text-white' : 'border border-dashed border-brass',
                  )}
                  aria-hidden
                >
                  {c.done && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.4L3.3 5.7 8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className={cx('flex-1', c.done && 'line-through decoration-graphite-faint/50')}>
                  {c.label}
                </span>
                {!c.done && (
                  <span className="font-mono text-2xs uppercase tracking-[0.1em] text-brass-deep">
                    fix
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {overflowing && (
        <Alert tone="brass" title="This may run past one page">
          You have roughly {lines} lines of content. Either cut the weakest bullets or set the
          density to Tight on the previous step.
        </Alert>
      )}

      {/* ----------------------------- export ----------------------------- */}
      <section className="rounded-lg border border-paper-line bg-white p-4">
        <h3 className="text-[13px] font-medium text-ink">Take it with you</h3>
        <p className="mb-3 text-2xs text-graphite-soft">
          Print gives you a real A4 PDF — choose &ldquo;Save as PDF&rdquo; as the destination.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => window.print()}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M4 5V1.8h6V5M4 10.5H2.5v-4h9v4H10M4 8.5h6v3.7H4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download as PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              downloadJSON(`${resume.slug}.json`, resume);
              success('Document data saved to your downloads.');
            }}
          >
            Export the data
          </Button>
        </div>
      </section>

      {/* ------------------------------ share ----------------------------- */}
      <section className="rounded-lg border border-paper-line bg-white p-4">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-[13px] font-medium text-ink">
              Shareable link
              <Badge tone={resume.published ? 'verdigris' : 'neutral'}>
                {resume.published ? 'live' : 'private'}
              </Badge>
            </h3>
            <p className="mt-0.5 text-2xs leading-relaxed text-graphite-soft">
              Publishing puts a read-only version of this page at a public address. Turn it off and
              the link stops working immediately.
            </p>
          </div>
        </div>

        <Switch
          checked={resume.published}
          onChange={(v) => {
            patch({ published: v });
            success(v ? 'Published. The link is live.' : 'Unpublished. The link no longer resolves.');
          }}
          label={resume.published ? 'Anyone with the link can read this' : 'Only you can see this'}
        />

        <div
          className={cx(
            'mt-3 overflow-hidden transition-all duration-300 ease-press',
            resume.published ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={shareUrl}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 rounded-md border border-paper-line bg-paper-sunk px-3 py-2 font-mono text-2xs text-graphite"
              aria-label="Public link to this document"
            />
            <Button variant={copied ? 'brass' : 'outline'} onClick={doCopy} className="shrink-0">
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button variant="ghost" to={`/r/${resume.slug}`} target="_blank" className="shrink-0">
              Open
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
