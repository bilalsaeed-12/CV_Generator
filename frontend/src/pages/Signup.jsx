import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/layout/Logo';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import { Alert } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cx, isEmail, passwordProblem } from '../lib/utils';

function StrengthBar({ value }) {
  const score = !value
    ? 0
    : [value.length >= 8, /[a-z]/.test(value) && /[A-Z]/.test(value), /\d/.test(value), /[^\w\s]/.test(value), value.length >= 12].filter(
        Boolean,
      ).length;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  const tones = ['bg-paper-line', 'bg-rust', 'bg-rust', 'bg-brass', 'bg-verdigris', 'bg-verdigris'];

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cx(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              i <= score ? tones[score] : 'bg-paper-line',
            )}
          />
        ))}
      </div>
      <span className="w-16 shrink-0 text-right font-mono text-2xs text-graphite-faint">
        {labels[score]}
      </span>
    </div>
  );
}

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const errors = {
    name: !form.name.trim() ? 'Tell us what to call you.' : null,
    email: !form.email ? 'Enter an email.' : !isEmail(form.email) ? 'That address is missing an @ or a domain.' : null,
    password: passwordProblem(form.password),
  };
  const valid = !errors.name && !errors.email && !errors.password;

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if (!valid) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await signUp(form);
      success('Account created. Start your first document.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-5 py-14">
      <div className="mb-8 text-center">
        <div className="mb-6 flex justify-center md:hidden">
          <Logo />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Start your first document
        </h1>
        <p className="mt-2 text-[15px] text-graphite-soft">
          It takes about twenty minutes, and nothing is charged.
        </p>
      </div>

      {formError && (
        <div className="mb-5">
          <Alert tone="rust" title="Could not create the account">
            {formError}
          </Alert>
        </div>
      )}

      <form onSubmit={submit} noValidate className="space-y-4 rounded-xl border border-paper-line bg-white p-6">
        <Field label="Name" htmlFor="name" error={touched.name ? errors.name : null} required>
          <Input
            id="name"
            autoComplete="name"
            value={form.name}
            error={touched.name && errors.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onBlur={() => setTouched({ ...touched, name: true })}
            placeholder="Ayesha Rahman"
          />
        </Field>

        <Field label="Email" htmlFor="email" error={touched.email ? errors.email : null} required>
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
          hint="8+ characters"
          error={touched.password ? errors.password : null}
          required
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            error={touched.password && errors.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onBlur={() => setTouched({ ...touched, password: true })}
            placeholder="••••••••"
          />
        </Field>

        {form.password && <StrengthBar value={form.password} />}

        <Button type="submit" variant="brass" size="lg" loading={submitting} className="w-full">
          Create account
        </Button>

        <p className="text-center text-2xs leading-relaxed text-graphite-faint">
          This is a student project. Your account lives in this browser only — use a password you do
          not use anywhere else.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-graphite-soft">
        Already have an account?{' '}
        <Link to="/login" className="link-underline font-medium text-ink">
          Sign in
        </Link>
      </p>
    </div>
  );
}
