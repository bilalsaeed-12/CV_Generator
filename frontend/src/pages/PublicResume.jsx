import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Logo from '../components/layout/Logo';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Feedback';
import PagePreview from '../components/preview/PagePreview';
import ResumePage from '../components/preview/ResumePage';
import { useToast } from '../context/ToastContext';
import * as api from '../lib/storage';
import { copyText } from '../lib/utils';

/**
 * The read-only page behind a share link. No session needed, no editing
 * affordances, and the document is the only thing with any visual weight.
 */
export default function PublicResume() {
  const { slug } = useParams();
  const { success, error } = useToast();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .getResumeBySlug(slug)
      .then((d) => alive && setDoc(d))
      .catch((e) => alive && setFailure(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (doc?.basics?.fullName) {
      document.title = `${doc.basics.fullName} — ${doc.basics.headline || 'Resume'}`;
    }
    return () => {
      document.title = 'Sheaf — Your career, properly typeset';
    };
  }, [doc]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-sunk px-5 py-10">
        <div className="mx-auto max-w-3xl">
          <Skeleton className="mx-auto h-6 w-40" />
          <Skeleton className="mt-8 h-[70vh] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (failure || !doc) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-paper px-6 text-center">
        <Logo />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Nothing lives at this address
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-graphite-soft">
            {failure} If someone sent you this link, ask them to publish the document again.
          </p>
        </div>
        <Button to="/" variant="outline">
          Go to Sheaf
        </Button>
      </div>
    );
  }

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: doc.basics.fullName, url });
        return;
      } catch {
        /* the person cancelled — fall through to copying */
      }
    }
    const ok = await copyText(url);
    if (ok) success('Link copied.');
    else error('The link could not be copied.');
  };

  return (
    <div className="print-root min-h-screen bg-paper-sunk">
      <header className="sticky top-0 z-30 border-b border-paper-line bg-paper/85 backdrop-blur-md print-hide">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-5">
          <Logo />
          <span className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={share}>
              Share
            </Button>
            <Button variant="primary" size="sm" onClick={() => window.print()}>
              Download PDF
            </Button>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="print-hide">
          <p className="mb-5 text-center font-mono text-2xs uppercase tracking-[0.16em] text-graphite-faint">
            Published {new Date(doc.updatedAt).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <PagePreview resume={doc} showCropMarks={false} />
        </div>

        {/* The sheet that survives printing. */}
        <div className="hidden print:block">
          <ResumePage resume={doc} forPrint />
        </div>

        <p className="mt-8 text-center text-2xs leading-relaxed text-graphite-faint print-hide">
          Typeset with Sheaf.{' '}
          <a href="/signup" className="link-underline text-graphite">
            Make your own
          </a>
        </p>
      </main>
    </div>
  );
}
