import { ACCENTS } from '../../lib/templates';
import { cx, dateRange } from '../../lib/utils';

/**
 * ResumePage
 * -----------------------------------------------------------------------------
 * The document itself — an A4 sheet at 96dpi, set in a serif, scaled to fit
 * whatever container it is dropped into. This is the one element on screen that
 * is allowed to look like paper; everything around it is workshop furniture.
 *
 * It is a pure function of the resume object, so it re-renders on every
 * keystroke without any wiring. That is the whole point of the live preview.
 */

const DENSITY = {
  airy: { gap: 22, line: 1.62, size: 10.4, section: 15 },
  regular: { gap: 16, line: 1.5, size: 10, section: 13 },
  tight: { gap: 11, line: 1.38, size: 9.5, section: 11.5 },
};

const accentHex = (id) => ACCENTS.find((a) => a.id === id)?.hex ?? '#C9821F';

function SectionRule({ title, accent, size }) {
  return (
    <div className="mb-2 flex items-center gap-2.5">
      <h3
        className="shrink-0 font-semibold uppercase tracking-[0.14em]"
        style={{ color: accent, fontSize: size * 0.72 }}
      >
        {title}
      </h3>
      <span className="h-px flex-1" style={{ backgroundColor: accent, opacity: 0.28 }} />
    </div>
  );
}

function Bullets({ items, line }) {
  const real = (items || []).filter((b) => b && b.trim());
  if (!real.length) return null;
  return (
    <ul className="mt-1 space-y-[3px]">
      {real.map((b, i) => (
        <li key={i} className="flex gap-2" style={{ lineHeight: line }}>
          <span className="mt-[0.42em] h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-45" />
          <span className="flex-1">{b}</span>
        </li>
      ))}
    </ul>
  );
}

function ContactLine({ basics, accent, separator = ' · ' }) {
  const bits = [
    basics.email,
    basics.phone,
    basics.location,
    basics.website,
    basics.github && `github.com/${basics.github}`,
    basics.linkedin && `linkedin.com/in/${basics.linkedin}`,
  ].filter(Boolean);

  if (!bits.length) {
    return <span className="italic opacity-35">Contact details appear here</span>;
  }
  return (
    <span>
      {bits.map((b, i) => (
        <span key={i}>
          {i > 0 && <span style={{ color: accent, opacity: 0.5 }}>{separator}</span>}
          {b}
        </span>
      ))}
    </span>
  );
}

/* ------------------------------ templates -------------------------------- */

function Quarto({ resume, accent, d }) {
  const b = resume.basics;
  return (
    <div className="flex flex-col" style={{ gap: d.gap }}>
      <header>
        <h1
          className="font-semibold leading-none tracking-tight"
          style={{ fontSize: d.size * 2.5, color: accent }}
        >
          {b.fullName || <span className="opacity-30">Your name</span>}
        </h1>
        <p className="mt-1 font-medium tracking-wide" style={{ fontSize: d.size * 1.05 }}>
          {b.headline || <span className="opacity-30">Your job title</span>}
        </p>
        <p className="mt-2 opacity-75" style={{ fontSize: d.size * 0.9 }}>
          <ContactLine basics={b} accent={accent} />
        </p>
      </header>

      {b.summary && <p style={{ lineHeight: d.line }}>{b.summary}</p>}

      <Experience resume={resume} accent={accent} d={d} />
      <Projects resume={resume} accent={accent} d={d} />
      <Education resume={resume} accent={accent} d={d} />
      <SkillsInline resume={resume} accent={accent} d={d} />
    </div>
  );
}

function Folio({ resume, accent, d }) {
  const b = resume.basics;
  return (
    <div className="flex" style={{ gap: d.gap * 1.5 }}>
      <aside
        className="shrink-0 border-r pr-5"
        style={{ width: '31%', borderColor: `${accent}33` }}
      >
        <div className="flex flex-col" style={{ gap: d.gap }}>
          <div>
            <h1
              className="font-semibold leading-[1.05] tracking-tight"
              style={{ fontSize: d.size * 1.9, color: accent }}
            >
              {b.fullName || <span className="opacity-30">Your name</span>}
            </h1>
            <p className="mt-1 font-medium" style={{ fontSize: d.size * 0.95 }}>
              {b.headline || <span className="opacity-30">Your job title</span>}
            </p>
          </div>

          <div style={{ fontSize: d.size * 0.85, lineHeight: 1.75 }} className="opacity-80">
            {[
              b.email,
              b.phone,
              b.location,
              b.website,
              b.github && `github.com/${b.github}`,
              b.linkedin && `in/${b.linkedin}`,
            ]
              .filter(Boolean)
              .map((v, i) => (
                <div key={i} className="break-words">
                  {v}
                </div>
              )) || null}
            {![b.email, b.phone, b.location].some(Boolean) && (
              <span className="italic opacity-35">Contact details</span>
            )}
          </div>

          {resume.skills?.length > 0 && (
            <div>
              <SectionRule title="Skills" accent={accent} size={d.section} />
              <div style={{ fontSize: d.size * 0.85, lineHeight: 1.7 }} className="opacity-85">
                {resume.skills.map((s, i) => (
                  <div key={i}>{s}</div>
                ))}
              </div>
            </div>
          )}

          <Education resume={resume} accent={accent} d={d} compact />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col" style={{ gap: d.gap }}>
        {b.summary && (
          <div>
            <SectionRule title="Profile" accent={accent} size={d.section} />
            <p style={{ lineHeight: d.line }}>{b.summary}</p>
          </div>
        )}
        <Experience resume={resume} accent={accent} d={d} />
        <Projects resume={resume} accent={accent} d={d} />
      </div>
    </div>
  );
}

function Broadside({ resume, accent, d }) {
  const b = resume.basics;
  return (
    <div className="flex flex-col" style={{ gap: d.gap }}>
      <header className="border-b pb-4 text-center" style={{ borderColor: `${accent}44` }}>
        <h1
          className="font-semibold uppercase leading-none"
          style={{ fontSize: d.size * 3, letterSpacing: '0.06em', color: accent }}
        >
          {b.fullName || <span className="opacity-30">Your name</span>}
        </h1>
        <p
          className="mt-2 uppercase tracking-[0.28em] opacity-70"
          style={{ fontSize: d.size * 0.78 }}
        >
          {b.headline || 'Your job title'}
        </p>
        <p className="mt-2.5 opacity-70" style={{ fontSize: d.size * 0.85 }}>
          <ContactLine basics={b} accent={accent} separator=" — " />
        </p>
      </header>

      {b.summary && (
        <p className="text-center italic" style={{ lineHeight: d.line, fontSize: d.size * 1.02 }}>
          {b.summary}
        </p>
      )}

      <Experience resume={resume} accent={accent} d={d} />
      <Projects resume={resume} accent={accent} d={d} />
      <div className="flex gap-8">
        <div className="flex-1">
          <Education resume={resume} accent={accent} d={d} />
        </div>
        <div className="flex-1">
          <SkillsInline resume={resume} accent={accent} d={d} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ shared blocks ---------------------------- */

function Experience({ resume, accent, d }) {
  const rows = (resume.experience || []).filter((e) => e.role || e.company);
  if (!rows.length) return null;
  return (
    <section>
      <SectionRule title="Experience" accent={accent} size={d.section} />
      <div className="space-y-3">
        {rows.map((e) => (
          <article key={e.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h4 className="font-semibold" style={{ fontSize: d.size * 1.05 }}>
                {e.role}
                {e.company && (
                  <span className="font-normal opacity-70">
                    {' '}
                    · {e.company}
                    {e.location ? `, ${e.location}` : ''}
                  </span>
                )}
              </h4>
              <span
                className="shrink-0 tabular-nums opacity-60"
                style={{ fontSize: d.size * 0.82 }}
              >
                {dateRange(e.start, e.end, e.current)}
              </span>
            </div>
            <Bullets items={e.bullets} line={d.line} />
          </article>
        ))}
      </div>
    </section>
  );
}

function Projects({ resume, accent, d }) {
  const rows = (resume.projects || []).filter((p) => p.name);
  if (!rows.length) return null;
  return (
    <section>
      <SectionRule title="Projects" accent={accent} size={d.section} />
      <div className="space-y-2.5">
        {rows.map((p) => (
          <article key={p.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h4 className="font-semibold" style={{ fontSize: d.size * 1.02 }}>
                {p.name}
                {p.stack && (
                  <span className="font-normal opacity-60" style={{ fontSize: d.size * 0.85 }}>
                    {' '}
                    · {p.stack}
                  </span>
                )}
              </h4>
              {p.link && (
                <span
                  className="shrink-0 opacity-60"
                  style={{ fontSize: d.size * 0.8, color: accent }}
                >
                  {p.link}
                </span>
              )}
            </div>
            <Bullets items={p.bullets} line={d.line} />
          </article>
        ))}
      </div>
    </section>
  );
}

function Education({ resume, accent, d, compact }) {
  const rows = (resume.education || []).filter((e) => e.degree || e.school);
  if (!rows.length) return null;
  return (
    <section>
      <SectionRule title="Education" accent={accent} size={d.section} />
      <div className="space-y-2">
        {rows.map((e) => (
          <article key={e.id}>
            <h4 className="font-semibold" style={{ fontSize: d.size * (compact ? 0.9 : 1.02) }}>
              {e.degree}
            </h4>
            <p className="opacity-70" style={{ fontSize: d.size * 0.85 }}>
              {[e.school, e.location].filter(Boolean).join(', ')}
            </p>
            <p className="tabular-nums opacity-55" style={{ fontSize: d.size * 0.8 }}>
              {dateRange(e.start, e.end)}
            </p>
            {e.note && !compact && (
              <p className="mt-0.5 opacity-75" style={{ fontSize: d.size * 0.88, lineHeight: d.line }}>
                {e.note}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function SkillsInline({ resume, accent, d }) {
  if (!resume.skills?.length) return null;
  return (
    <section>
      <SectionRule title="Skills" accent={accent} size={d.section} />
      <p style={{ lineHeight: d.line }}>
        {resume.skills.map((s, i) => (
          <span key={s}>
            {i > 0 && <span style={{ color: accent, opacity: 0.45 }}> · </span>}
            {s}
          </span>
        ))}
      </p>
    </section>
  );
}

/* --------------------------------- shell --------------------------------- */

const LAYOUTS = { quarto: Quarto, folio: Folio, broadside: Broadside };

export default function ResumePage({ resume, scale = 1, className, forPrint = false }) {
  if (!resume) return null;

  const design = resume.design || {};
  const accent = accentHex(design.accent);
  const d = DENSITY[design.density] || DENSITY.regular;
  const Layout = LAYOUTS[design.template] || Folio;

  return (
    <div
      className={cx(
        'origin-top bg-white font-doc text-ink',
        forPrint ? 'print-sheet' : 'shadow-page',
        className,
      )}
      style={{
        width: 794,
        minHeight: 1123,
        padding: 52,
        fontSize: d.size,
        lineHeight: d.line,
        transform: scale === 1 ? undefined : `scale(${scale})`,
      }}
    >
      <Layout resume={resume} accent={accent} d={d} />
    </div>
  );
}
