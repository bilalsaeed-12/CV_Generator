import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-lg flex-col items-center justify-center px-5 text-center">
      <p className="font-mono text-6xl font-medium tabular-nums text-brass">404</p>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink text-balance">
        This page was never set
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-graphite-soft text-pretty">
        The address you followed does not match anything here. It may have been a share link that
        has since been unpublished.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to="/" variant="brass">
          Back to the start
        </Button>
        <Button to="/dashboard" variant="outline">
          Your documents
        </Button>
      </div>
      <p className="mt-8 text-2xs text-graphite-faint">
        Looking for the layouts?{' '}
        <Link to="/templates" className="link-underline text-graphite">
          They are here
        </Link>
      </p>
    </div>
  );
}
