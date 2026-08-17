import { useState } from 'react';
import { Textarea } from '../ui/Field';
import Button from '../ui/Button';
import AssistPanel from './AssistPanel';
import { diagnose } from '../../lib/aiAssist';
import { cx } from '../../lib/utils';

/** Small inline gauge — green when the line is doing its job, amber when not. */
function Strength({ text }) {
  const { score, issues } = diagnose(text);
  if (!text.trim()) return null;

  const tone =
    score >= 84 ? 'bg-verdigris' : score >= 60 ? 'bg-brass' : 'bg-rust';

  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={issues.length ? issues.map((i) => i.label).join(' · ') : 'This line reads well'}
    >
      <span className="h-1 w-10 overflow-hidden rounded-full bg-paper-line">
        <span
          className={cx('block h-full rounded-full transition-all duration-500 ease-press', tone)}
          style={{ width: `${score}%` }}
        />
      </span>
      <span className="font-mono text-2xs tabular-nums text-graphite-faint">{score}</span>
    </span>
  );
}

export default function BulletEditor({ bullets, onChange, context, label = 'What you did' }) {
  const [assistIndex, setAssistIndex] = useState(null);

  const update = (i, value) => {
    const next = [...bullets];
    next[i] = value;
    onChange(next);
  };

  const add = () => {
    onChange([...bullets, '']);
    setAssistIndex(null);
  };

  const remove = (i) => {
    onChange(bullets.length === 1 ? [''] : bullets.filter((_, idx) => idx !== i));
    setAssistIndex(null);
  };

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= bullets.length) return;
    const next = [...bullets];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setAssistIndex(null);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        <span className="text-2xs text-graphite-faint">
          One line per result, strongest first
        </span>
      </div>

      {bullets.map((bullet, i) => (
        <div key={i} className="group">
          <div className="relative">
            <Textarea
              value={bullet}
              onChange={(e) => update(i, e.target.value)}
              rows={2}
              maxLength={280}
              placeholder={
                i === 0
                  ? 'Cut page load from 3.1s to 1.2s by splitting the bundle'
                  : 'Add another result'
              }
              className="pr-2"
            />
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Strength text={bullet} />

            <div className="ml-auto flex items-center gap-0.5 opacity-60 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="rounded p-1.5 text-graphite-faint transition-colors hover:bg-paper-sunk hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                aria-label={`Move line ${i + 1} up`}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden>
                  <path d="M5.5 9V2M2 5.5l3.5-3.5L9 5.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === bullets.length - 1}
                className="rounded p-1.5 text-graphite-faint transition-colors hover:bg-paper-sunk hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                aria-label={`Move line ${i + 1} down`}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden>
                  <path d="M5.5 2v7M2 5.5L5.5 9 9 5.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded p-1.5 text-graphite-faint transition-colors hover:bg-rust/10 hover:text-rust"
                aria-label={`Delete line ${i + 1}`}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden>
                  <path d="M1.6 3h7.8M4.4 3V1.8h2.2V3M2.6 3l.4 6.2h5l.4-6.2" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <Button
                type="button"
                size="sm"
                variant={assistIndex === i ? 'brass' : 'outline'}
                onClick={() => setAssistIndex(assistIndex === i ? null : i)}
                disabled={!bullet.trim()}
                className="ml-1"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
                  <path d="M7 1l1.5 3.9L12.4 6.4 8.5 7.9 7 11.8 5.5 7.9 1.6 6.4 5.5 4.9z" fill="currentColor" />
                </svg>
                Sharpen
              </Button>
            </div>
          </div>

          <AssistPanel
            open={assistIndex === i}
            original={bullet}
            context={context}
            onApply={(text) => {
              update(i, text);
              setAssistIndex(null);
            }}
            onClose={() => setAssistIndex(null)}
          />
        </div>
      ))}

      <Button type="button" variant="ghost" size="sm" onClick={add}>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Add a line
      </Button>
    </div>
  );
}
