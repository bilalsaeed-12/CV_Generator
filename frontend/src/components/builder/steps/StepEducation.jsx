import { Field, Input, Textarea } from '../../ui/Field';
import Button from '../../ui/Button';
import { EmptyState } from '../../ui/Feedback';
import EntryCard from '../EntryCard';
import { emptyEducation } from '../../../lib/templates';
import { dateRange } from '../../../lib/utils';

export default function StepEducation({ resume, patch }) {
  const rows = resume.education;

  const update = (id, changes) =>
    patch({ education: rows.map((r) => (r.id === id ? { ...r, ...changes } : r)) });
  const add = () => patch({ education: [...rows, emptyEducation()] });
  const remove = (id) => patch({ education: rows.filter((r) => r.id !== id) });
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ education: next });
  };

  if (!rows.length) {
    return (
      <EmptyState
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M10 3l8 4-8 4-8-4 8-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M5 8.8V13c0 1.1 2.2 2.5 5 2.5s5-1.4 5-2.5V8.8" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        }
        title="No education listed"
        body="Add your degree, or the bootcamp and certifications that got you here."
        action={<Button onClick={add}>Add education</Button>}
      />
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <EntryCard
          key={row.id}
          index={i}
          title={row.degree}
          subtitle={row.school}
          meta={dateRange(row.start, row.end)}
          defaultOpen={i === 0}
          canMoveUp={i > 0}
          canMoveDown={i < rows.length - 1}
          onMoveUp={() => move(i, -1)}
          onMoveDown={() => move(i, 1)}
          onRemove={() => remove(row.id)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Degree or programme" htmlFor={`deg-${row.id}`} required>
              <Input
                id={`deg-${row.id}`}
                value={row.degree}
                onChange={(e) => update(row.id, { degree: e.target.value })}
                placeholder="BS Computer Science"
              />
            </Field>
            <Field label="Institution" htmlFor={`school-${row.id}`} required>
              <Input
                id={`school-${row.id}`}
                value={row.school}
                onChange={(e) => update(row.id, { school: e.target.value })}
                placeholder="NUST"
              />
            </Field>
            <Field label="Location" htmlFor={`eloc-${row.id}`}>
              <Input
                id={`eloc-${row.id}`}
                value={row.location}
                onChange={(e) => update(row.id, { location: e.target.value })}
                placeholder="Islamabad, PK"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From" htmlFor={`estart-${row.id}`}>
                <Input
                  id={`estart-${row.id}`}
                  value={row.start}
                  onChange={(e) => update(row.id, { start: e.target.value })}
                  placeholder="2018"
                />
              </Field>
              <Field label="To" htmlFor={`eend-${row.id}`}>
                <Input
                  id={`eend-${row.id}`}
                  value={row.end}
                  onChange={(e) => update(row.id, { end: e.target.value })}
                  placeholder="2022"
                />
              </Field>
            </div>
            <Field
              label="Anything worth mentioning"
              htmlFor={`note-${row.id}`}
              hint="Optional"
              className="sm:col-span-2"
            >
              <Textarea
                id={`note-${row.id}`}
                value={row.note}
                onChange={(e) => update(row.id, { note: e.target.value })}
                rows={2}
                maxLength={200}
                placeholder="Final year project: an offline-first survey app used by 200 enumerators."
              />
            </Field>
          </div>
        </EntryCard>
      ))}

      <Button variant="outline" onClick={add} className="w-full">
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Add more education
      </Button>
    </div>
  );
}
