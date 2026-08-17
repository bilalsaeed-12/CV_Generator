import { ACCENTS, DENSITIES, TEMPLATES } from '../../../lib/templates';
import { cx } from '../../../lib/utils';

/** Miniature of each layout, drawn rather than screenshotted, so it stays true. */
function LayoutThumb({ id, accent }) {
  const bar = (w, o = 1) => (
    <span className="block h-[3px] rounded-full bg-current" style={{ width: w, opacity: o }} />
  );

  if (id === 'quarto') {
    return (
      <div className="flex h-full w-full flex-col gap-[5px] p-2.5 text-graphite">
        <span className="block h-[7px] w-[55%] rounded-sm" style={{ background: accent }} />
        {bar('35%', 0.5)}
        <span className="mt-1 block h-px w-full" style={{ background: accent, opacity: 0.3 }} />
        {bar('100%', 0.28)}
        {bar('92%', 0.28)}
        {bar('96%', 0.28)}
        {bar('70%', 0.28)}
      </div>
    );
  }
  if (id === 'broadside') {
    return (
      <div className="flex h-full w-full flex-col items-center gap-[5px] p-2.5 text-graphite">
        <span className="block h-[8px] w-[75%] rounded-sm" style={{ background: accent }} />
        {bar('40%', 0.45)}
        <span className="my-1 block h-px w-full" style={{ background: accent, opacity: 0.35 }} />
        {bar('88%', 0.28)}
        {bar('94%', 0.28)}
        {bar('80%', 0.28)}
      </div>
    );
  }
  return (
    <div className="flex h-full w-full gap-2 p-2.5 text-graphite">
      <div className="flex w-[32%] flex-col gap-[4px] border-r pr-1.5" style={{ borderColor: `${accent}55` }}>
        <span className="block h-[6px] w-full rounded-sm" style={{ background: accent }} />
        {bar('80%', 0.35)}
        {bar('65%', 0.28)}
        {bar('72%', 0.28)}
      </div>
      <div className="flex flex-1 flex-col gap-[4px]">
        {bar('100%', 0.28)}
        {bar('90%', 0.28)}
        {bar('96%', 0.28)}
        {bar('62%', 0.28)}
      </div>
    </div>
  );
}

export default function StepDesign({ resume, patch }) {
  const design = resume.design;
  const accentHex = ACCENTS.find((a) => a.id === design.accent)?.hex ?? '#C9821F';
  const set = (changes) => patch({ design: { ...design, ...changes } });

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-[13px] font-medium text-ink">Layout</h3>
        <p className="mb-3 text-2xs text-graphite-soft">
          Changes apply to the page on the right immediately.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          {TEMPLATES.map((t) => {
            const active = design.template === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => set({ template: t.id })}
                aria-pressed={active}
                className={cx(
                  'group overflow-hidden rounded-lg border text-left transition-all duration-200',
                  active
                    ? 'border-ink shadow-lift'
                    : 'border-paper-line hover:-translate-y-0.5 hover:border-graphite-faint hover:shadow-sm',
                )}
              >
                <div className="h-24 border-b border-paper-line bg-white">
                  <LayoutThumb id={t.id} accent={accentHex} />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-ink">{t.name}</span>
                    {active && (
                      <svg width="11" height="11" viewBox="0 0 12 12" className="text-verdigris" aria-hidden>
                        <circle cx="6" cy="6" r="6" fill="currentColor" />
                        <path d="M3.2 6.1l2 2 3.6-4" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <p className="mt-0.5 text-2xs leading-relaxed text-graphite-soft">{t.tagline}</p>
                  <p className="mt-2 font-mono text-2xs uppercase tracking-[0.1em] text-graphite-faint">
                    {t.bestFor}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-[13px] font-medium text-ink">Accent ink</h3>
        <p className="mb-3 text-2xs text-graphite-soft">
          Used for your name, the section rules, and links.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {ACCENTS.map((a) => {
            const active = design.accent === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => set({ accent: a.id })}
                aria-pressed={active}
                aria-label={a.name}
                title={a.name}
                className={cx(
                  'group flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 transition-all duration-200',
                  active
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
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-[13px] font-medium text-ink">Density</h3>
        <p className="mb-3 text-2xs text-graphite-soft">
          How much air sits between the lines. Tighten this if you are spilling onto a second page.
        </p>
        <div className="inline-flex rounded-lg border border-paper-line bg-white p-1">
          {DENSITIES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => set({ density: d.id })}
              aria-pressed={design.density === d.id}
              title={d.note}
              className={cx(
                'rounded-md px-4 py-2 text-[13px] transition-all duration-200',
                design.density === d.id
                  ? 'bg-ink text-paper shadow-sm'
                  : 'text-graphite hover:bg-paper-sunk hover:text-ink',
              )}
            >
              {d.name}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
