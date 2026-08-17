/**
 * aiAssist.js
 * -----------------------------------------------------------------------------
 * The assist that rewrites a weak bullet point.
 *
 * `improveBullet()` is the single seam between this app and a real model. It
 * returns three rewrites plus a short note on what changed, which is exactly
 * what an LLM would hand back if you asked it for JSON. Swap the body for a
 * fetch to your own /api/assist route and every caller keeps working — see the
 * commented block at the bottom of this file.
 *
 * Until then the rewrites come from a small rules engine, which is honest about
 * what it is: it finds real weaknesses (passive openings, duty verbs, hedges,
 * missing numbers) and fixes them. It is not pretending to be a model.
 */

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* Verbs that describe a job description rather than a person's work. */
const DUTY_OPENERS = [
  'responsible for',
  'tasked with',
  'in charge of',
  'duties included',
  'helped with',
  'worked on',
  'assisted with',
  'involved in',
  'participated in',
];

/* Weak verb -> stronger verb, grouped by the kind of work it describes. */
const VERB_LIFT = {
  made: 'built',
  did: 'delivered',
  used: 'applied',
  got: 'secured',
  helped: 'drove',
  worked: 'delivered',
  handled: 'owned',
  managed: 'led',
  created: 'built',
  wrote: 'authored',
  fixed: 'resolved',
  improved: 'lifted',
  increased: 'grew',
  decreased: 'cut',
  reduced: 'cut',
  added: 'shipped',
  built: 'engineered',
  designed: 'architected',
  tested: 'validated',
  learned: 'mastered',
  started: 'launched',
  changed: 'overhauled',
  updated: 'modernised',
  checked: 'audited',
  talked: 'briefed',
  met: 'partnered',
  set: 'established',
};

const HEDGES = [
  'basically',
  'kind of',
  'sort of',
  'a bit',
  'some',
  'various',
  'several',
  'many',
  'a lot of',
  'really',
  'very',
  'just',
  'try to',
  'tried to',
  'attempted to',
];

const STRONG_OPENERS = [
  'Led', 'Shipped', 'Built', 'Cut', 'Grew', 'Owned', 'Launched', 'Rebuilt',
  'Automated', 'Scaled', 'Streamlined', 'Consolidated', 'Drove', 'Delivered',
];

/** Rough scan for whether the line contains a measurable result. */
const hasMetric = (text) => /\d/.test(text);

/* ---------------------------- diagnosis ---------------------------------- */

/**
 * Reads a bullet and reports what is wrong with it. Used both to generate the
 * rewrites and to tell the user why the assist touched the line at all.
 */
export function diagnose(text) {
  const t = String(text || '').trim();
  const lower = t.toLowerCase();
  const issues = [];

  if (!t) return { issues: [{ id: 'empty', label: 'Nothing written yet' }], score: 0 };

  if (DUTY_OPENERS.some((d) => lower.startsWith(d))) {
    issues.push({ id: 'duty', label: 'Opens by describing the job, not your work' });
  }
  if (/^(i|we|my team)\b/i.test(t)) {
    issues.push({ id: 'pronoun', label: 'Starts with a pronoun — resumes drop them' });
  }
  if (/\b(was|were|been|being)\s+\w+(ed|en)\b/i.test(t)) {
    issues.push({ id: 'passive', label: 'Written in the passive voice' });
  }
  if (!hasMetric(t)) {
    issues.push({ id: 'metric', label: 'No number, so the impact is unmeasured' });
  }
  const foundHedge = HEDGES.find((h) => new RegExp(`\\b${h}\\b`, 'i').test(lower));
  if (foundHedge) {
    issues.push({ id: 'hedge', label: `Hedging language ("${foundHedge}") softens the claim` });
  }
  const firstWord = lower.split(/\s+/)[0]?.replace(/[^a-z]/g, '');
  if (VERB_LIFT[firstWord]) {
    issues.push({ id: 'verb', label: `"${firstWord}" is a weak opening verb` });
  }
  if (t.split(/\s+/).length > 34) {
    issues.push({ id: 'length', label: 'Long enough that the result gets buried' });
  }
  if (t.split(/\s+/).length < 5) {
    issues.push({ id: 'thin', label: 'Too short to carry any evidence' });
  }

  const score = Math.max(0, Math.min(100, 100 - issues.length * 16));
  return { issues, score };
}

/* ---------------------------- rewriting ---------------------------------- */

function stripOpeners(text) {
  let out = text.trim();
  for (const d of DUTY_OPENERS) {
    const re = new RegExp(`^${d}\\s+`, 'i');
    if (re.test(out)) {
      out = out.replace(re, '');
      break;
    }
  }
  out = out.replace(/^(i|we|my team)\s+/i, '');
  out = out.replace(/^(also|then|additionally)[,\s]+/i, '');
  return out.trim();
}

function dropHedges(text) {
  let out = text;
  for (const h of HEDGES) {
    out = out.replace(new RegExp(`\\b${h}\\s+`, 'gi'), '');
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

function liftVerb(text, fallbackIndex = 0) {
  const words = text.split(/\s+/);
  if (!words.length) return text;
  const bare = words[0].toLowerCase().replace(/[^a-z]/g, '');

  if (VERB_LIFT[bare]) {
    words[0] = capitalise(VERB_LIFT[bare]);
    return words.join(' ');
  }
  // Already a verb-ish opener? Leave it, just fix the case.
  if (/^[a-z]+(ed|ing)$/i.test(bare) || STRONG_OPENERS.some((s) => s.toLowerCase() === bare)) {
    words[0] = capitalise(words[0]);
    return words.join(' ');
  }
  // Noun opener — front it with a strong verb instead.
  const opener = STRONG_OPENERS[fallbackIndex % STRONG_OPENERS.length];
  return `${opener} ${lowerFirst(words.join(' '))}`;
}

function tighten(text) {
  return text
    .replace(/\bin order to\b/gi, 'to')
    .replace(/\bdue to the fact that\b/gi, 'because')
    .replace(/\bwas able to\b/gi, '')
    .replace(/\bthe process of\b/gi, '')
    .replace(/\ba number of\b/gi, '')
    .replace(/\bon a daily basis\b/gi, 'daily')
    .replace(/\butilis(e|ed|ing)\b/gi, (m) => m.replace(/utilis/i, 'us'))
    .replace(/\butiliz(e|ed|ing)\b/gi, (m) => m.replace(/utiliz/i, 'us'))
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.])/g, '$1')
    .trim();
}

const capitalise = (w) => (w ? w[0].toUpperCase() + w.slice(1) : w);
const lowerFirst = (w) => (w ? w[0].toLowerCase() + w.slice(1) : w);
const clean = (t) => tighten(t).replace(/\.+$/, '');

/**
 * Three rewrites, each with a different editorial priority, so the user is
 * choosing between real alternatives rather than shades of the same sentence.
 */
function buildVariants(original, context = {}) {
  const base = clean(dropHedges(stripOpeners(original)));
  const role = context.role ? ` as ${context.role}` : '';
  const needsMetric = !hasMetric(original);

  /* 1 — Impact first: the result leads, the method follows. */
  const impact = (() => {
    const core = liftVerb(base, 0);
    if (needsMetric) {
      return `${core}, cutting turnaround by [X]% across [N] releases`;
    }
    return core;
  })();

  /* 2 — Scope and ownership: what you owned and how big it was. */
  const scope = (() => {
    const core = liftVerb(base, 3);
    const owned = /\b(led|owned|drove|managed)\b/i.test(core)
      ? core
      : `Owned ${lowerFirst(core)}`;
    return needsMetric ? `${owned} for a team of [N]${role}` : `${owned}${role}`;
  })();

  /* 3 — Tightest possible reading, for a one-page layout under pressure. */
  const terse = (() => {
    const core = liftVerb(base, 7);
    const words = core.split(/\s+/);
    const trimmed = words.length > 18 ? `${words.slice(0, 18).join(' ')}` : core;
    return needsMetric ? `${trimmed} — [X]% improvement` : trimmed;
  })();

  return [
    {
      id: 'impact',
      label: 'Impact first',
      note: 'Leads with the outcome and names the measurement.',
      text: `${impact}.`,
    },
    {
      id: 'scope',
      label: 'Ownership',
      note: 'Foregrounds what you owned and the size of it.',
      text: `${scope}.`,
    },
    {
      id: 'terse',
      label: 'Tightest',
      note: 'Cut to the shortest line that still carries evidence.',
      text: `${terse}.`,
    },
  ].map((v) => ({ ...v, text: v.text.replace(/\s+\./g, '.').replace(/\.\.+/g, '.') }));
}

/**
 * The one function to replace when the real model goes in.
 *
 * @param {string} text     the bullet as written
 * @param {object} context  { role, company, kind: 'experience' | 'project' }
 * @returns {Promise<{ variants: Array, issues: Array, score: number }>}
 */
export async function improveBullet(text, context = {}) {
  const trimmed = String(text || '').trim();
  if (trimmed.length < 3) {
    throw new Error('Write a few words first, then the assist has something to work with.');
  }

  // Latency that matches a real model call, so the loading state earns its place.
  await wait(900 + Math.random() * 700);

  // Deliberate failure path, ~1 in 25, so the error state is exercised in dev
  // rather than discovered in production. Delete this once the API is live.
  if (Math.random() < 0.04) {
    throw new Error('The assist did not respond. Try that again.');
  }

  const { issues, score } = diagnose(trimmed);
  return { variants: buildVariants(trimmed, context), issues, score };
}

/**
 * Summary generator for the profile section. Same seam, same contract.
 */
export async function draftSummary({ fullName, headline, experience = [], skills = [] }) {
  await wait(1100);
  const years = experience.length;
  const topSkills = skills.slice(0, 4).join(', ');
  const latest = experience[0];

  const role = headline || latest?.role || 'developer';
  const where = latest?.company ? ` at ${latest.company}` : '';
  const first = fullName?.split(' ')[0] || 'You';

  return [
    `${role} with ${years ? `${years} role${years > 1 ? 's' : ''} of` : 'hands-on'} experience${where}.`,
    topSkills ? `Works day to day in ${topSkills}.` : '',
    `Known for shipping carefully and explaining the reasoning behind it — ask ${first} about the last thing that broke and what changed because of it.`,
  ]
    .filter(Boolean)
    .join(' ');
}

/* -----------------------------------------------------------------------------
 * SWAPPING IN A REAL MODEL
 * -----------------------------------------------------------------------------
 * Keep the key on the server. The browser calls your route, your route calls
 * the provider. Replace the body of improveBullet with:
 *
 *   export async function improveBullet(text, context = {}) {
 *     const res = await fetch('/api/assist/bullet', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ text, context }),
 *     });
 *     if (!res.ok) throw new Error('The assist did not respond. Try that again.');
 *     return res.json(); // { variants: [{id,label,note,text}], issues: [], score }
 *   }
 *
 * And on the server, ask the model for exactly that JSON shape:
 *
 *   "Rewrite this resume bullet three ways: impact-first, ownership-first, and
 *    tightest. Keep every factual claim the user made. Where a number is
 *    missing, insert a [X] placeholder rather than inventing one. Reply with
 *    JSON only: { variants: [{ id, label, note, text }], issues: [], score }."
 *
 * The placeholder instruction matters — a model that invents metrics will put
 * a lie on someone's resume.
 * -------------------------------------------------------------------------- */
