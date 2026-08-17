import { Field, TagInput } from '../../ui/Field';
import { Alert } from '../../ui/Feedback';

const SUGGESTIONS = {
  'Languages & frameworks': [
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue', 'Node.js', 'Express',
    'Python', 'Django', 'PHP', 'Laravel', 'Java', 'C++',
  ],
  'Styling & design': ['Tailwind CSS', 'CSS Modules', 'SASS', 'Figma', 'Framer Motion', 'Accessibility (WCAG 2.2)'],
  'Data & infrastructure': ['PostgreSQL', 'MongoDB', 'Redis', 'Prisma', 'Docker', 'AWS', 'Vercel', 'Supabase'],
  'Practice': ['Git', 'CI/CD', 'Jest', 'Playwright', 'REST APIs', 'GraphQL', 'Agile', 'Code review'],
};

export default function StepSkills({ resume, patch }) {
  const skills = resume.skills;
  const has = (s) => skills.some((x) => x.toLowerCase() === s.toLowerCase());

  return (
    <div className="space-y-6">
      <Field
        label="Your skills"
        hint={`${skills.length} added`}
        error={
          skills.length > 18
            ? 'Past about 18 the list stops being read. Cut the ones you would not want to be tested on.'
            : null
        }
      >
        <TagInput tags={skills} onChange={(next) => patch({ skills: next })} />
      </Field>

      {skills.length < 5 && (
        <Alert tone="brass">
          Aim for at least five. Below that the section looks thinner than your actual ability.
        </Alert>
      )}

      <div className="space-y-5">
        <p className="text-2xs uppercase tracking-[0.16em] text-graphite-faint font-mono">
          Tap to add
        </p>
        {Object.entries(SUGGESTIONS).map(([group, items]) => (
          <div key={group}>
            <h4 className="mb-2 text-[13px] font-medium text-ink">{group}</h4>
            <div className="flex flex-wrap gap-1.5">
              {items.map((s) => {
                const added = has(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      patch({
                        skills: added
                          ? skills.filter((x) => x.toLowerCase() !== s.toLowerCase())
                          : [...skills, s],
                      })
                    }
                    className={
                      added
                        ? 'rounded-full border border-verdigris/40 bg-verdigris-wash px-3 py-1.5 text-[13px] text-verdigris-deep transition-all duration-150'
                        : 'rounded-full border border-paper-line bg-white px-3 py-1.5 text-[13px] text-graphite transition-all duration-150 hover:-translate-y-px hover:border-graphite-faint hover:text-ink hover:shadow-sm'
                    }
                    aria-pressed={added}
                  >
                    {added && (
                      <span className="mr-1 inline-block" aria-hidden>
                        ✓
                      </span>
                    )}
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
