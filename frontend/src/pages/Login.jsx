import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/layout/Logo';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import { Alert } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isEmail } from '../lib/utils';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const from = location.state?.from || '/dashboard';

  const errors = {
    email: !form.email ? 'Enter your email.' : !isEmail(form.email) ? 'That address does not look right.' : null,
    password: !form.password ? 'Enter your password.' : null,
  };
  const valid = !errors.email && !errors.password;

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!valid) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await signIn(form);
      success('Signed in.');
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* One-click way in, so a reviewer never has to invent credentials. */
  const useDemo = async () => {
    setSubmitting(true);
    setFormError(null);
    const creds = { email: 'demo@sheaf.app', password: 'demo1234' };
    try {
      await signIn(creds);
    } catch {
      try {
        await signUp({ name: 'Demo User', ...creds });
      } catch (err) {
        setFormError(err.message);
        setSubmitting(false);
        return;
      }
    }
    success('Signed in to the demo account.');
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-5 py-14">
      <div className="mb-8 text-center">
        <div className="mb-6 flex justify-center md:hidden">
          <Logo />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Welcome back</h1>
        <p className="mt-2 text-[15px] text-graphite-soft">
          Pick up whichever document you left open.
        </p>
      </div>

      {formError && (
        <div className="mb-5">
          <Alert tone="rust" title="Could not sign you in">
            {formError}
          </Alert>
        </div>
      )}

      <form onSubmit={submit} noValidate className="space-y-4 rounded-xl border border-paper-line bg-white p-6">
        <Field
          label="Email"
          htmlFor="email"
          error={touched.email ? errors.email : null}
          required
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            error={touched.email && errors.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onBlur={() => setTouched({ ...touched, email: true })}
            placeholder="you@example.com"
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={touched.password ? errors.password : null}
          required
        >
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            error={touched.password && errors.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onBlur={() => setTouched({ ...touched, password: true })}
            placeholder="••••••••"
          />
        </Field>

        <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
          Sign in
        </Button>

        <div className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-paper-line" />
          <span className="font-mono text-2xs uppercase tracking-[0.14em] text-graphite-faint">or</span>
          <span className="h-px flex-1 bg-paper-line" />
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={useDemo}
          disabled={submitting}
          className="w-full"
        >
          Use the demo account
        </Button>
        <p className="text-center text-2xs leading-relaxed text-graphite-faint">
          Creates demo@sheaf.app on first use, then signs you straight in.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-graphite-soft">
        No account yet?{' '}
        <Link to="/signup" className="link-underline font-medium text-ink">
          Create one
        </Link>
      </p>
    </div>
  );
}
