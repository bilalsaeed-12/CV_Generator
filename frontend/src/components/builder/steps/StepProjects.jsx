import { Field, Input } from '../../ui/Field';
import Button from '../../ui/Button';
import { EmptyState } from '../../ui/Feedback';
import EntryCard from '../EntryCard';
import BulletEditor from '../BulletEditor';
import { emptyProject } from '../../../lib/templates';

export default function StepProjects({ resume, patch }) {
  const rows = resume.projects;

  const update = (id, changes) =>
    patch({ projects: rows.map((r) => (r.id === id ? { ...r, ...changes } : r)) });
  const add = () => patch({ projects: [...rows, emptyProject()] });
  const remove = (id) => patch({ projects: rows.filter((r) => r.id !== id) });
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ projects: next });
  };

  if (!rows.length) {
    return (
      <EmptyState
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M7 13l-3.5-3L7 6.5M13 6.5l3.5 3.5L13 13.5M11.5 4.5l-3 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
        title="No projects yet"
        body="For early-career applications this section often carries more weight than the experience above it."
        action={<Button onClick={add}>Add a project</Button>}
      />
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <EntryCard
          key={row.id}
          index={i}
          title={row.name}
          subtitle={row.stack}
          defaultOpen={i === 0}
          canMoveUp={i > 0}
          canMoveDown={i < rows.length - 1}
          onMoveUp={() => move(i, -1)}
          onMoveDown={() => move(i, 1)}
          onRemove={() => remove(row.id)}
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Project name" htmlFor={`pname-${row.id}`} required>
                <Input
                  id={`pname-${row.id}`}
                  value={row.name}
                  onChange={(e) => update(row.id, { name: e.target.value })}
                  placeholder="Ledgerline"
                />
              </Field>
              <Field label="Link" htmlFor={`plink-${row.id}`} hint="Repo or live site">
                <Input
                  id={`plink-${row.id}`}
                  value={row.link}
                  onChange={(e) => update(row.id, { link: e.target.value })}
                  placeholder="github.com/you/project"
                />
              </Field>
              <Field label="Built with" htmlFor={`pstack-${row.id}`} className="sm:col-span-2">
                <Input
                  id={`pstack-${row.id}`}
                  value={row.stack}
                  onChange={(e) => update(row.id, { stack: e.target.value })}
                  placeholder="React, IndexedDB, Vite"
                />
              </Field>
            </div>

            <div className="border-t border-paper-line pt-4">
              <BulletEditor
                bullets={row.bullets}
                onChange={(bullets) => update(row.id, { bullets })}
                context={{ role: row.name, kind: 'project' }}
                label="What it does, and what was hard about it"
              />
            </div>
          </div>
        </EntryCard>
      ))}

      <Button variant="outline" onClick={add} className="w-full">
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Add another project
      </Button>
    </div>
  );
}
