import { useState } from 'react';
import { Field, Input, Textarea } from '../../ui/Field';
import Button from '../../ui/Button';
import { Spinner } from '../../ui/Feedback';
import { draftSummary } from '../../../lib/aiAssist';
import { useToast } from '../../../context/ToastContext';
import { isEmail } from '../../../lib/utils';

export default function StepBasics({ resume, patch }) {
  const b = resume.basics;
  const [drafting, setDrafting] = useState(false);
  const { success, error } = useToast();

  const set = (key) => (e) => patch({ basics: { ...b, [key]: e.target.value } });

  const emailInvalid = b.email.length > 0 && !isEmail(b.email);

  const writeSummary = async () => {
    setDrafting(true);
    try {
      const text = await draftSummary({
        fullName: b.fullName,
        headline: b.headline,
        experience: resume.experience.filter((e) => e.role),
        skills: resume.skills,
      });
      patch({ basics: { ...b, summary: text } });
      success('Summary drafted. Edit it so it sounds like you.');
    } catch {
      error('The summary could not be drafted. Try again in a moment.');
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" required>
          <Input
            id="fullName"
            value={b.fullName}
            onChange={set('fullName')}
            placeholder="Ayesha Rahman"
            autoComplete="name"
          />
        </Field>

        <Field label="Job title" htmlFor="headline" hint="The role you want" required>
          <Input
            id="headline"
            value={b.headline}
            onChange={set('headline')}
            placeholder="Frontend engineer"
          />
        </Field>

        <Field
          label="Email"
          htmlFor="email"
          required
          error={emailInvalid ? 'That address is missing an @ or a domain.' : null}
        >
          <Input
            id="email"
            type="email"
            value={b.email}
            onChange={set('email')}
            error={emailInvalid}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>

        <Field label="Phone" htmlFor="phone">
          <Input
            id="phone"
            value={b.phone}
            onChange={set('phone')}
            placeholder="+92 300 0000000"
            autoComplete="tel"
          />
        </Field>

        <Field label="Location" htmlFor="location" hint="City and country is enough">
          <Input id="location" value={b.location} onChange={set('location')} placeholder="Rawalpindi, PK" />
        </Field>

        <Field label="Website" htmlFor="website">
          <Input id="website" value={b.website} onChange={set('website')} placeholder="yourname.dev" />
        </Field>

        <Field label="GitHub username" htmlFor="github" hint="Username only">
          <Input id="github" value={b.github} onChange={set('github')} placeholder="ayesharahman" />
        </Field>

        <Field label="LinkedIn username" htmlFor="linkedin" hint="Username only">
          <Input id="linkedin" value={b.linkedin} onChange={set('linkedin')} placeholder="ayesharahman" />
        </Field>
      </div>

      <div className="rounded-lg border border-paper-line bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-[13px] font-medium text-ink">Summary</h3>
            <p className="text-2xs text-graphite-soft">
              Two or three sentences. What you do, and what you are good at.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={writeSummary}
            disabled={drafting || !b.headline}
            title={!b.headline ? 'Add a job title first' : undefined}
          >
            {drafting ? (
              <>
                <Spinner className="h-3.5 w-3.5" />
                Drafting
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
                  <path d="M7 1l1.5 3.9L12.4 6.4 8.5 7.9 7 11.8 5.5 7.9 1.6 6.4 5.5 4.9z" fill="currentColor" />
                </svg>
                Draft one for me
              </>
            )}
          </Button>
        </div>

        <Textarea
          value={b.summary}
          onChange={set('summary')}
          rows={4}
          maxLength={420}
          placeholder="Frontend engineer who cares about the parts of an interface people notice only when they are wrong."
        />
      </div>
    </div>
  );
}
