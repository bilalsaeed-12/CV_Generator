import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Logo from '../components/layout/Logo';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Badge, DocumentSkeleton, ProgressRing, Spinner } from '../components/ui/Feedback';
import PagePreview from '../components/preview/PagePreview';
import ResumePage from '../components/preview/ResumePage';
import StepBasics from '../components/builder/steps/StepBasics';
import StepExperience from '../components/builder/steps/StepExperience';
import StepEducation from '../components/builder/steps/StepEducation';
import StepSkills from '../components/builder/steps/StepSkills';
import StepProjects from '../components/builder/steps/StepProjects';
import StepDesign from '../components/builder/steps/StepDesign';
import StepReview from '../components/builder/steps/StepReview';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as api from '../lib/storage';
import { completeness, cx, relativeTime } from '../lib/utils';

const STEPS = [
  { id: 'basics', label: 'Basics', note: 'Who you are and how to reach you', Component: StepBasics },
  { id: 'experience', label: 'Experience', note: 'Roles, and what changed because of you', Component: StepExperience },
  { id: 'education', label: 'Education', note: 'Degrees, bootcamps, certifications', Component: StepEducation },
  { id: 'skills', label: 'Skills', note: 'What you would be happy to be tested on', Component: StepSkills },
  { id: 'projects', label: 'Projects', note: 'Things you built and shipped', Component: StepProjects },
  { id: 'design', label: 'Design', note: 'Layout, ink, and density', Component: StepDesign },
  { id: 'review', label: 'Review', note: 'Check, export, and share', Component: StepReview },
];

export default function Builder() {
  const { id } = useParams();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saveState, setSaveState] = useState('saved'); // saved | saving | error
  const [savedAt, setSavedAt] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const saveTimer = useRef(null);
  const firstRender = useRef(true);

  /* ------------------------------ load ---------------------------------- */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .getResume(id)
      .then((doc) => {
        if (!alive) return;
        if (doc.userId !== user?.id) {
          setLoadError('This document belongs to another account.');
        } else {
          setResume(doc);
          setSavedAt(doc.updatedAt);
        }
      })
      .catch((e) => alive && setLoadError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, user]);

  /* --------------------------- debounced save --------------------------- */
  useEffect(() => {
    if (!resume || firstRender.current) {
      firstRender.current = false;
      return undefined;
    }
    setSaveState('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const saved = await api.saveResume(resume.id, resume);
        setSaveState('saved');
        setSavedAt(saved.updatedAt);
      } catch {
        setSaveState('error');
      }
    }, 700);
    return () => clearTimeout(saveTimer.current);
  }, [resume]);

  /* Warn before leaving with an unsaved edit still in the debounce window. */
  useEffect(() => {
    const handler = (e) => {
      if (saveState === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saveState]);

  const patch = useCallback((changes) => {
    setResume((prev) => (prev ? { ...prev, ...changes } : prev));
  }, []);

  const goToStep = useCallback(
    (next) => {
      setDirection(next > step ? 1 : -1);
      setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
      document.getElementById('step-top')?.scrollIntoView({ block: 'start' });
    },
    [step],
  );

  /* Alt+Arrow moves between steps without reaching for the mouse. */
  useEffect(() => {
    const onKey = (e) => {
      if (!e.altKey) return;
      if (e.key === 'ArrowRight') goToStep(step + 1);
      if (e.key === 'ArrowLeft') goToStep(step - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, goToStep]);

  const progress = useMemo(() => completeness(resume), [resume]);

  /* ------------------------------ states -------------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <div className="h-14 border-b border-paper-line bg-paper" />
        <div className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[1fr_460px]">
          <div className="space-y-4">
            <div className="skeleton h-8 w-48" />
            <DocumentSkeleton />
            <DocumentSkeleton />
          </div>
          <div className="skeleton hidden h-[560px] rounded-lg lg:block" />
        </div>
      </div>
    );
  }

  if (loadError || !resume) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          This document could not be opened
        </h1>
        <p className="max-w-sm text-sm text-graphite-soft">{loadError}</p>
        <Button to="/dashboard">Back to your documents</Button>
      </div>
    );
  }

  const Current = STEPS[step].Component;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="print-root min-h-screen bg-paper">
      {/* ------------------------------ top bar --------------------------- */}
      <header className="sticky top-0 z-40 border-b border-paper-line bg-paper/90 backdrop-blur-md print-hide">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          {/* Logo renders its own anchor — never wrap it in another Link. */}
          <Logo to="/dashboard" className="shrink-0" />

          <span className="hidden h-5 w-px bg-paper-line sm:block" />

          <button
            onClick={() => {
              setTitleDraft(resume.title);
              setRenaming(true);
            }}
            className="group min-w-0 truncate rounded px-2 py-1 text-sm text-ink transition-colors hover:bg-paper-sunk"
            title="Rename this document"
          >
            {resume.title}
            <span className="ml-1.5 text-graphite-faint opacity-0 transition-opacity group-hover:opacity-100">
              edit
            </span>
          </button>

          <span className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.12em] sm:flex">
              {saveState === 'saving' && (
                <>
                  <Spinner className="h-3 w-3 text-brass" />
                  <span className="text-graphite-soft">saving</span>
                </>
              )}
              {saveState === 'saved' && (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-verdigris" />
                  <span className="text-graphite-soft">saved {relativeTime(savedAt)}</span>
                </>
              )}
              {saveState === 'error' && (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-rust" />
                  <span className="text-rust">not saved</span>
                </>
              )}
            </span>

            <span className="text-brass lg:hidden">
              <ProgressRing value={progress.percent} size={30} stroke={3} label="" />
            </span>

            <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)} className="lg:hidden">
              Preview
            </Button>
            <Button size="sm" variant="primary" onClick={() => window.print()} className="hidden sm:inline-flex">
              Download PDF
            </Button>
          </span>
        </div>
      </header>

      {/* ------------------------- step rail (mobile) --------------------- */}
      <div className="no-scrollbar overflow-x-auto border-b border-paper-line bg-white lg:hidden print-hide">
        <div className="flex min-w-max gap-1 px-4 py-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goToStep(i)}
              aria-current={i === step ? 'step' : undefined}
              className={cx(
                'rounded-full px-3 py-1.5 text-[13px] transition-colors',
                i === step ? 'bg-ink text-paper' : 'text-graphite hover:bg-paper-sunk',
              )}
            >
              <span className="mr-1.5 font-mono text-2xs opacity-60">{i + 1}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[210px_minmax(0,1fr)_400px] xl:grid-cols-[230px_minmax(0,1fr)_480px]">
        {/* ---------------------- step rail (desktop) -------------------- */}
        <nav className="hidden lg:block print-hide" aria-label="Builder steps">
          <div className="sticky top-20">
            <div className="mb-5 flex items-center gap-3 rounded-lg border border-paper-line bg-white p-3">
              <span className={cx(progress.percent === 100 ? 'text-verdigris' : 'text-brass')}>
                <ProgressRing value={progress.percent} size={38} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink">Complete</p>
                <p className="truncate text-2xs text-graphite-soft">
                  {progress.checks.filter((c) => c.done).length} of {progress.checks.length} checks
                </p>
              </div>
            </div>

            <ol className="relative space-y-0.5">
              <span
                className="absolute left-[13px] top-2 h-[calc(100%-16px)] w-px bg-paper-line"
                aria-hidden
              />
              {STEPS.map((s, i) => {
                const active = i === step;
                const done = i < step;
                return (
                  <li key={s.id} className="relative">
                    <button
                      onClick={() => goToStep(i)}
                      aria-current={active ? 'step' : undefined}
                      className={cx(
                        'group flex w-full items-start gap-3 rounded-md px-1.5 py-2 text-left transition-colors',
                        active ? 'bg-paper-sunk' : 'hover:bg-paper-sunk/60',
                      )}
                    >
                      <span
                        className={cx(
                          'relative z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border font-mono text-[9px] transition-all duration-200',
                          active && 'border-ink bg-ink text-paper',
                          done && !active && 'border-verdigris bg-verdigris text-white',
                          !active && !done && 'border-paper-line bg-white text-graphite-faint',
                        )}
                      >
                        {done && !active ? (
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden>
                            <path d="M1 3.4L3.3 5.7 8 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={cx(
                            'block text-[13px] transition-colors',
                            active ? 'font-semibold text-ink' : 'text-graphite group-hover:text-ink',
                          )}
                        >
                          {s.label}
                        </span>
                        {active && (
                          <span className="mt-0.5 block text-2xs leading-snug text-graphite-soft">
                            {s.note}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <p className="mt-5 px-1.5 font-mono text-2xs leading-relaxed text-graphite-faint">
              Alt + ← / → moves between steps
            </p>
          </div>
        </nav>

        {/* ----------------------------- form ---------------------------- */}
        <main id="step-top" className="min-w-0 print-hide">
          <div
            key={step}
            className={direction > 0 ? 'animate-slide-in-right' : 'animate-slide-in-left'}
          >
            <div className="mb-5">
              <p className="eyebrow">
                Step {step + 1} of {STEPS.length}
              </p>
              <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-[28px]">
                {STEPS[step].label}
              </h1>
              <p className="mt-1 text-sm text-graphite-soft">{STEPS[step].note}</p>
            </div>

            <Current resume={resume} patch={patch} onGoToStep={goToStep} />
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-paper-line pt-5">
            <Button variant="ghost" onClick={() => goToStep(step - 1)} disabled={step === 0}>
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </Button>

            {isLast ? (
              <Button variant="brass" to="/dashboard">
                Done for now
              </Button>
            ) : (
              <Button variant="primary" onClick={() => goToStep(step + 1)}>
                Next: {STEPS[step + 1].label}
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                  <path d="M4.5 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            )}
          </div>
        </main>

        {/* --------------------------- live page ------------------------- */}
        <aside className="hidden lg:block print-hide">
          <div className="sticky top-20">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="eyebrow">Live page</span>
              <Badge tone={resume.published ? 'verdigris' : 'neutral'}>
                {resume.published ? 'published' : 'private'}
              </Badge>
            </div>
            <div className="rounded-xl border border-paper-line bg-paper-sunk p-5 drafting-grid">
              <PagePreview resume={resume} />
            </div>
            <p className="mt-2.5 text-center text-2xs text-graphite-faint">
              A4 at actual proportions — what you see is what prints
            </p>
          </div>
        </aside>
      </div>

      {/* The only node that survives the print stylesheet. */}
      <div className="hidden print:block">
        <ResumePage resume={resume} forPrint />
      </div>

      {/* ------------------------- mobile preview ------------------------ */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Live page"
        description="Updates as you type on every step."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPreviewOpen(false)}>
              Back to editing
            </Button>
            <Button variant="primary" onClick={() => window.print()}>
              Download PDF
            </Button>
          </>
        }
      >
        <div className="rounded-lg bg-paper-sunk p-3 drafting-grid">
          <PagePreview resume={resume} />
        </div>
      </Modal>

      {/* ---------------------------- rename ----------------------------- */}
      <Modal
        open={renaming}
        onClose={() => setRenaming(false)}
        title="Rename document"
        description="Only you see this name. It does not appear on the page itself."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenaming(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const clean = titleDraft.trim();
                if (!clean) {
                  error('Give the document a name.');
                  return;
                }
                patch({ title: clean });
                setRenaming(false);
                success('Renamed.');
              }}
            >
              Save name
            </Button>
          </>
        }
      >
        <input
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="h-10 w-full rounded-md border border-paper-line bg-white px-3 text-sm transition-colors focus:border-brass"
          placeholder="Frontend applications — 2026"
          aria-label="Document name"
        />
      </Modal>
    </div>
  );
}
