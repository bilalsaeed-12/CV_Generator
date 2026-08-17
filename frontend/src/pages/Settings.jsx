import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Field, Input } from '../components/ui/Field';
import { Alert } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as api from '../lib/storage';
import { isEmail, passwordProblem } from '../lib/utils';

export default function Settings() {
  const { user, updateProfile, signOut, removeAccount } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [profile, setProfile] = useState({ name: user.name, email: user.email });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  // The backend requires the password to delete an account — typing DELETE
  // alone is a UI guard, not proof of identity.
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const profileDirty = profile.name !== user.name || profile.email !== user.email;
  const profileValid = profile.name.trim() && isEmail(profile.email);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profileValid) return;
    setSavingProfile(true);
    try {
      await updateProfile({ name: profile.name.trim(), email: profile.email.trim().toLowerCase() });
      success('Profile updated.');
    } catch (err) {
      error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwError(null);

    const problem = passwordProblem(pw.next);
    if (problem) return setPwError(problem);
    if (pw.next !== pw.confirm) return setPwError('The two new passwords do not match.');

    setSavingPw(true);
    try {
      await api.changePassword(user.id, { current: pw.current, next: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      success('Password changed.');
    } catch (err) {
      setPwError(err.message);
    } finally {
      setSavingPw(false);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await removeAccount(deletePassword);
      navigate('/', { replace: true });
      success('Account and documents deleted.');
    } catch (err) {
      error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 lg:py-14">
      <header>
        <p className="eyebrow">Account</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="mt-1.5 text-[15px] text-graphite-soft">
          Member since{' '}
          {new Date(user.createdAt).toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </header>

      {/* ----------------------------- profile ---------------------------- */}
      <form onSubmit={saveProfile} className="mt-10 rounded-xl border border-paper-line bg-white p-6">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Profile</h2>
        <p className="mb-5 text-2xs text-graphite-soft">
          Used to greet you and to sign in. It does not appear on your documents.
        </p>

        <div className="space-y-4">
          <Field label="Name" htmlFor="s-name">
            <Input
              id="s-name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </Field>
          <Field
            label="Email"
            htmlFor="s-email"
            error={profile.email && !isEmail(profile.email) ? 'That address does not look right.' : null}
          >
            <Input
              id="s-email"
              type="email"
              value={profile.email}
              error={profile.email && !isEmail(profile.email)}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </Field>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button type="submit" loading={savingProfile} disabled={!profileDirty || !profileValid}>
            Save changes
          </Button>
          {profileDirty && (
            <Button
              type="button"
              variant="quiet"
              onClick={() => setProfile({ name: user.name, email: user.email })}
            >
              Discard
            </Button>
          )}
        </div>
      </form>

      {/* ---------------------------- password ---------------------------- */}
      <form onSubmit={savePassword} className="mt-6 rounded-xl border border-paper-line bg-white p-6">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Password</h2>
        <p className="mb-5 text-2xs text-graphite-soft">
          At least 8 characters, with a letter and a number.
        </p>

        {pwError && (
          <div className="mb-4">
            <Alert tone="rust">{pwError}</Alert>
          </div>
        )}

        <div className="space-y-4">
          <Field label="Current password" htmlFor="pw-current">
            <Input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              value={pw.current}
              onChange={(e) => setPw({ ...pw, current: e.target.value })}
            />
          </Field>
          <Field label="New password" htmlFor="pw-next">
            <Input
              id="pw-next"
              type="password"
              autoComplete="new-password"
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
            />
          </Field>
          <Field label="Confirm new password" htmlFor="pw-confirm">
            <Input
              id="pw-confirm"
              type="password"
              autoComplete="new-password"
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            />
          </Field>
        </div>

        <Button
          type="submit"
          loading={savingPw}
          disabled={!pw.current || !pw.next || !pw.confirm}
          className="mt-5"
        >
          Change password
        </Button>
      </form>

      {/* ---------------------------- session ----------------------------- */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-paper-line bg-white p-6">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Session</h2>
          <p className="text-2xs text-graphite-soft">
            Signing out leaves your documents in this browser.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await signOut();
            navigate('/');
            success('Signed out.');
          }}
        >
          Sign out
        </Button>
      </div>

      {/* ----------------------------- danger ----------------------------- */}
      <div className="mt-6 rounded-xl border border-rust/25 bg-[#FBEDE8]/40 p-6">
        <h2 className="font-display text-lg font-semibold tracking-tight text-rust">
          Delete this account
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-graphite">
          Every document you have written goes with it, including any published links. There is no
          recovery.
        </p>
        <Button variant="danger" className="mt-4" onClick={() => setConfirmingDelete(true)}>
          Delete account
        </Button>
      </div>

      <Modal
        open={confirmingDelete}
        onClose={() => {
          setConfirmingDelete(false);
          setDeleteText('');
          setDeletePassword('');
        }}
        title="Delete your account"
        description="Confirm your password and type DELETE. Everything goes."
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setConfirmingDelete(false);
                setDeleteText('');
                setDeletePassword('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              disabled={deleteText !== 'DELETE' || !deletePassword}
              onClick={doDelete}
            >
              Delete everything
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Your password" htmlFor="del-pw" required>
            <Input
              id="del-pw"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Field label="Type DELETE to confirm" htmlFor="del-text" required>
            <Input
              id="del-text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="DELETE"
              className="font-mono"
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
