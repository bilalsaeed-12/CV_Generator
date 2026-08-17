/** Tiny class joiner. No dependency needed for what amounts to a filter+join. */
export const cx = (...parts) => parts.flat(Infinity).filter(Boolean).join(' ');

export function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function dateRange(start, end, current) {
  if (!start && !end) return '';
  if (current) return `${start || ''} — Present`;
  if (start && end) return `${start} — ${end}`;
  return start || end;
}

/* ------------------------------ validation -------------------------------- */

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

export function passwordProblem(v) {
  if (!v) return 'Choose a password.';
  if (v.length < 8) return 'Use at least 8 characters.';
  if (!/[a-zA-Z]/.test(v) || !/[0-9]/.test(v)) return 'Mix in at least one letter and one number.';
  return null;
}

/**
 * How finished the document is, and what to do next. Drives the progress ring
 * on the builder and the ready-to-send check on the review step.
 */
export function completeness(resume) {
  if (!resume) return { percent: 0, checks: [] };
  const b = resume.basics || {};
  const filledExp = (resume.experience || []).filter((e) => e.role && e.company);
  const filledEdu = (resume.education || []).filter((e) => e.degree && e.school);
  const filledProj = (resume.projects || []).filter((p) => p.name);
  const bulletCount = filledExp.reduce(
    (n, e) => n + e.bullets.filter((x) => x.trim()).length,
    0,
  );

  const checks = [
    { id: 'name', label: 'Name and job title', done: Boolean(b.fullName && b.headline) },
    { id: 'contact', label: 'A working email', done: isEmail(b.email || '') },
    { id: 'summary', label: 'A short summary', done: (b.summary || '').trim().length > 40 },
    { id: 'exp', label: 'At least one role', done: filledExp.length > 0 },
    { id: 'bullets', label: 'Three or more bullet points', done: bulletCount >= 3 },
    { id: 'edu', label: 'Education', done: filledEdu.length > 0 },
    { id: 'skills', label: 'Five or more skills', done: (resume.skills || []).length >= 5 },
    { id: 'proj', label: 'A project', done: filledProj.length > 0 },
  ];

  const done = checks.filter((c) => c.done).length;
  return { percent: Math.round((done / checks.length) * 100), checks };
}

/** Very rough page-fit estimate, shown as a warning on the review step. */
export function estimateLines(resume) {
  if (!resume) return 0;
  const b = resume.basics || {};
  let lines = 8;
  lines += Math.ceil((b.summary || '').length / 90);
  for (const e of resume.experience || []) {
    lines += 2 + e.bullets.filter(Boolean).reduce((n, t) => n + Math.ceil(t.length / 92), 0);
  }
  lines += (resume.education || []).filter((e) => e.degree).length * 2;
  lines += (resume.projects || []).filter((p) => p.name).length * 3;
  lines += Math.ceil((resume.skills || []).length / 6);
  return lines;
}

export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API needs a secure context; fall back to the old trick.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}
