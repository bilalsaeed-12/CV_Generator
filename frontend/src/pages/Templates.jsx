import { useState } from 'react';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Feedback';
import PagePreview from '../components/preview/PagePreview';
import { ACCENTS, DENSITIES, TEMPLATES, sampleResume } from '../lib/templates';
import { cx } from '../lib/utils';

export default function Templates() {
  const [template, setTemplate] = useState('folio');
  const [accent, setAccent] = useState('brass');
  const [density, setDensity] = useState('regular');

  const preview = { ...sampleResume(), design: { template, accent, density, showPhoto: false } };
  const active = TEMPLATES.find((t) => t.id === template);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-20">
      <header className="max-w-2xl">
        <p className="eyebrow">Layouts</p>
        <h1 className="mt-3 text-title font-bold text-ink text-balance">
          Three ways to set the same facts
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-graphite text-pretty">
          Every layout is typeset from the same document, so switching never costs you anything.
          Change it the morning of an application if the job asks for something different.
        </p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px]">
        {/* ---------------------------- controls ------------------------- */}
        <div className="space-y-8">
          <section>
            <h2 className="eyebrow mb-3">Layout</h2>
            <div className="space-y-3">
              {TEMPLATES.map((t) => {
                const isActive = template === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    aria-pressed={isActive}
                    className={cx(
                      'block w-full rounded-xl border p-5 text-left transition-all duration-200',
                      isActive
                        ? 'border-ink bg-white shadow-lift'
                        : 'border-paper-line bg-white hover:-translate-y-0.5 hover:border-graphite-faint hover:shadow-sm',
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                        {t.name}
                      </h3>
                      <Badge tone={isActive ? 'ink' : 'neutral'}>
                        {t.columns === 2 ? 'two column' : 'one column'}
                      </Badge>
                      {isActive && <Badge tone="verdigris">showing</Badge>}
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed text-graphite text-pretty">
                      {t.description}
                    </p>
                    <p className="mt-3 font-mono text-2xs uppercase tracking-[0.12em] text-graphite-faint">
                      Best for: {t.bestFor}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="eyebrow mb-3">Accent ink</h2>
            <div className="flex flex-wrap gap-2.5">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAccent(a.id)}
                  aria-pressed={accent === a.id}
                  aria-label={a.name}
                  className={cx(
                    'flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 transition-all duration-200',
                    accent === a.id
                      ? 'border-ink bg-white shadow-sm'
                      : 'border-paper-line bg-white hover:-translate-y-px hover:border-graphite-faint hover:shadow-sm',
                  )}
                >
                  <span
                    className="h-6 w-6 rounded-full ring-1 ring-inset ring-black/10"
                    style={{ background: a.hex }}
                  />
                  <span className="text-[13px] text-ink">{a.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="eyebrow mb-3">Density</h2>
            <div className="inline-flex rounded-lg border border-paper-line bg-white p-1">
              {DENSITIES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDensity(d.id)}
                  aria-pressed={density === d.id}
                  title={d.note}
                  className={cx(
                    'rounded-md px-4 py-2 text-[13px] transition-all duration-200',
                    density === d.id
                      ? 'bg-ink text-paper shadow-sm'
                      : 'text-graphite hover:bg-paper-sunk hover:text-ink',
                  )}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </section>

          <div className="rounded-xl border border-paper-line bg-white p-5">
            <p className="text-[15px] leading-relaxed text-graphite">
              You are looking at {active.name} in {ACCENTS.find((a) => a.id === accent).name}. Every
              combination is available on a free account.
            </p>
            <Button to="/signup" variant="brass" className="mt-4">
              Use this layout
            </Button>
          </div>
        </div>

        {/* ---------------------------- the page ------------------------- */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-paper-line bg-paper-sunk p-5 drafting-grid">
            <PagePreview resume={preview} />
          </div>
          <p className="mt-3 text-center text-2xs text-graphite-faint">
            Rendered live — this is the same component that prints your PDF
          </p>
        </div>
      </div>
    </div>
  );
}
