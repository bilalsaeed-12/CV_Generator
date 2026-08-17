import { Field, Input, Checkbox } from '../../ui/Field';
import Button from '../../ui/Button';
import { EmptyState } from '../../ui/Feedback';
import EntryCard from '../EntryCard';
import BulletEditor from '../BulletEditor';
import { emptyExperience } from '../../../lib/templates';
import { dateRange } from '../../../lib/utils';

export default function StepExperience({ resume, patch }) {
  const rows = resume.experience;

  const update = (id, changes) =>
    patch({ experience: rows.map((r) => (r.id === id ? { ...r, ...changes } : r)) });

  const add = () => patch({ experience: [...rows, emptyExperience()] });
  const remove = (id) => patch({ experience: rows.filter((r) => r.id !== id) });

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ experience: next });
  };

  if (!rows.length) {
    return (
      <EmptyState
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <rect x="2.5" y="5.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M7 5.5V4a1 1 0 011-1h4a1 1 0 011 1v1.5" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        }
        title="No roles yet"
        body="Start with your most recent job. Internships, freelance work, and open source all count."
        action={
          <Button onClick={add} variant="primary">
            Add your first role
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <EntryCard
          key={row.id}
          index={i}
          title={row.role}
          subtitle={row.company}
          meta={dateRange(row.start, row.end, row.current)}
          defaultOpen={i === 0}
          canMoveUp={i > 0}
          canMoveDown={i < rows.length - 1}
          onMoveUp={() => move(i, -1)}
          onMoveDown={() => move(i, 1)}
          onRemove={() => remove(row.id)}
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Role" htmlFor={`role-${row.id}`} required>
                <Input
                  id={`role-${row.id}`}
                  value={row.role}
                  onChange={(e) => update(row.id, { role: e.target.value })}
                  placeholder="Frontend engineer"
                />
              </Field>
              <Field label="Company" htmlFor={`company-${row.id}`} required>
                <Input
                  id={`company-${row.id}`}
                  value={row.company}
                  onChange={(e) => update(row.id, { company: e.target.value })}
                  placeholder="Northline"
                />
              </Field>
              <Field label="Location" htmlFor={`loc-${row.id}`}>
                <Input
                  id={`loc-${row.id}`}
                  value={row.location}
                  onChange={(e) => update(row.id, { location: e.target.value })}
                  placeholder="Remote"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="From" htmlFor={`start-${row.id}`}>
                  <Input
                    id={`start-${row.id}`}
                    value={row.start}
                    onChange={(e) => update(row.id, { start: e.target.value })}
                    placeholder="2024"
                  />
                </Field>
                <Field label="To" htmlFor={`end-${row.id}`}>
                  <Input
                    id={`end-${row.id}`}
                    value={row.current ? '' : row.end}
                    disabled={row.current}
                    onChange={(e) => update(row.id, { end: e.target.value })}
                    placeholder={row.current ? 'Present' : '2025'}
                  />
                </Field>
              </div>
            </div>

            <Checkbox
              id={`current-${row.id}`}
              checked={row.current}
              onChange={(v) => update(row.id, { current: v, end: v ? '' : row.end })}
              label="I still work here"
            />

            <div className="border-t border-paper-line pt-4">
              <BulletEditor
                bullets={row.bullets}
                onChange={(bullets) => update(row.id, { bullets })}
                context={{ role: row.role, company: row.company, kind: 'experience' }}
              />
            </div>
          </div>
        </EntryCard>
      ))}

      <Button variant="outline" onClick={add} className="w-full">
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Add another role
      </Button>
    </div>
  );
}
