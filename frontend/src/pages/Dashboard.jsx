import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Badge, EmptyState, ProgressRing, Skeleton } from '../components/ui/Feedback';
import { Input, Select } from '../components/ui/Field';
import ResumePage from '../components/preview/ResumePage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as api from '../lib/storage';
import { blankResume, sampleResume } from '../lib/templates';
import { completeness, cx, relativeTime } from '../lib/utils';

/** Thumbnail of the actual document, scaled right down. Honest, not an icon. */
function DocThumb({ resume }) {
  return (
    <div className="relative h-[132px] overflow-hidden rounded-md border border-paper-line bg-white">
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2" style={{ width: 794 }}>
        <ResumePage resume={resume} scale={0.24} className="origin-top" />
      </div>
      <span className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" aria-hidden />
    </div>
  );
}

function DocCardSkeleton() {
  return (
    <div className="rounded-xl border border-paper-line bg-white p-3">
      <Skeleton className="h-[132px] w-full rounded-md" />
      <div className="space-y-2 p-2 pt-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('updated');
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .listResumes(user.id)
      .then(setDocs)
      .catch(() => error('Your documents could not be loaded.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? docs.filter(
          (d) =>
            d.title.toLowerCase().includes(q) ||
            (d.basics?.fullName || '').toLowerCase().includes(q) ||
            (d.basics?.headline || '').toLowerCase().includes(q),
        )
      : docs;

    return [...filtered].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      if (sort === 'complete') return completeness(b).percent - completeness(a).percent;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [docs, query, sort]);

  const create = async (seed) => {
    setCreating(true);
    try {
      const doc = await api.createResume(user.id, seed);
      success('Document created.');
      navigate(`/builder/${doc.id}`);
    } catch (e) {
      error(e.message);
      setCreating(false);
    }
  };

  const duplicate = async (id) => {
    setBusyId(id);
    try {
      await api.duplicateResume(id);
      success('Copy created. Tailor it for the next application.');
      load();
    } catch (e) {
      error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    const doc = confirmDelete;
    setConfirmDelete(null);
    setBusyId(doc.id);
    try {
      await api.deleteResume(doc.id);
      success(`"${doc.title}" deleted.`);
      load();
    } catch (e) {
      error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your documents</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
            Good to see you, {user.name.split(' ')[0]}
          </h1>
          <p className="mt-1.5 text-[15px] text-graphite-soft">
            {loading
              ? 'Fetching what you have.'
              : docs.length === 0
                ? 'Nothing here yet.'
                : `${docs.length} document${docs.length > 1 ? 's' : ''}, ${docs.filter((d) => d.published).length} published.`}
          </p>
        </div>

        <Button variant="brass" size="lg" loading={creating} onClick={() => create(blankResume())}>
          <svg width="13" height="13" viewBox="0 0 12 12" aria-hidden>
            <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          New document
        </Button>
      </header>

      {/* --------------------------- filter bar --------------------------- */}
      {!loading && docs.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint"
              aria-hidden
            >
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
              <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, title, or job"
              className="pl-9"
              aria-label="Search your documents"
            />
          </div>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-auto" aria-label="Sort">
            <option value="updated">Recently edited</option>
            <option value="title">Name A–Z</option>
            <option value="complete">Most complete</option>
          </Select>
        </div>
      )}

      {/* ----------------------------- states ----------------------------- */}
      {loading && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <DocCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && docs.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                <rect x="4" y="2.5" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M7.5 7h7M7.5 10.5h7M7.5 14h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            }
            title="No documents yet"
            body="Start from a blank sheet, or open the worked example and replace the parts that are not yours. The example is often faster."
            action={
              <div className="flex flex-wrap justify-center gap-2.5">
                <Button variant="brass" loading={creating} onClick={() => create(blankResume())}>
                  Start blank
                </Button>
                <Button
                  variant="outline"
                  disabled={creating}
                  onClick={() => create({ ...sampleResume(), title: 'My first document' })}
                >
                  Open the example
                </Button>
              </div>
            }
          />
        </div>
      )}

      {!loading && docs.length > 0 && visible.length === 0 && (
        <div className="mt-8">
          <EmptyState
            title={`Nothing matches "${query}"`}
            body="Try a shorter search, or clear it to see everything again."
            action={
              <Button variant="outline" onClick={() => setQuery('')}>
                Clear search
              </Button>
            }
          />
        </div>
      )}

      {/* ------------------------------ grid ------------------------------ */}
      {!loading && visible.length > 0 && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((doc, i) => {
            const { percent } = completeness(doc);
            return (
              <article
                key={doc.id}
                className={cx(
                  'group animate-fade-up rounded-xl border border-paper-line bg-white p-3 transition-all duration-300',
                  'hover:-translate-y-1 hover:border-graphite-faint/60 hover:shadow-lift',
                  busyId === doc.id && 'pointer-events-none opacity-50',
                )}
                style={{ animationDelay: `${Math.min(i, 8) * 45}ms`, animationDuration: '.45s' }}
              >
                <Link to={`/builder/${doc.id}`} className="block" aria-label={`Open ${doc.title}`}>
                  <DocThumb resume={doc} />
                </Link>

                <div className="p-2 pt-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/builder/${doc.id}`}
                        className="block truncate font-display text-[15px] font-semibold tracking-tight text-ink transition-colors hover:text-brass-deep"
                      >
                        {doc.title}
                      </Link>
                      <p className="mt-0.5 truncate text-2xs text-graphite-soft">
                        {doc.basics?.headline || 'No job title yet'} · edited{' '}
                        {relativeTime(doc.updatedAt)}
                      </p>
                    </div>
                    <span className={cx('shrink-0', percent === 100 ? 'text-verdigris' : 'text-brass')}>
                      <ProgressRing value={percent} size={32} stroke={3} />
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Badge tone={doc.published ? 'verdigris' : 'neutral'}>
                      {doc.published ? 'published' : 'private'}
                    </Badge>

                    <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100">
                      {doc.published && (
                        <Link
                          to={`/r/${doc.slug}`}
                          target="_blank"
                          className="rounded p-1.5 text-graphite-faint transition-colors hover:bg-paper-sunk hover:text-ink"
                          aria-label={`View public page for ${doc.title}`}
                          title="View public page"
                        >
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                            <path d="M5 2H2.5v8.5H11V8M7.5 1.5H11.5V5.5M11.5 1.5L6 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </Link>
                      )}
                      <button
                        onClick={() => duplicate(doc.id)}
                        className="rounded p-1.5 text-graphite-faint transition-colors hover:bg-paper-sunk hover:text-ink"
                        aria-label={`Duplicate ${doc.title}`}
                        title="Duplicate"
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                          <rect x="4.5" y="4.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
                          <path d="M8.5 2.5v-.3a.7.7 0 00-.7-.7H2.2a.7.7 0 00-.7.7v5.6c0 .4.3.7.7.7h.3" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmDelete(doc)}
                        className="rounded p-1.5 text-graphite-faint transition-colors hover:bg-rust/10 hover:text-rust"
                        aria-label={`Delete ${doc.title}`}
                        title="Delete"
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                          <path d="M2 3.5h9M5.2 3.5V2.2h2.6v1.3M3.2 3.5l.5 7.3h5.6l.5-7.3" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete this document?"
        description={`"${confirmDelete?.title}" and everything in it goes. This cannot be undone.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={remove}>
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-graphite">
          If you only want to stop sharing it, unpublish it from the Review step instead — that keeps
          the document and kills the link.
        </p>
      </Modal>
    </div>
  );
}
