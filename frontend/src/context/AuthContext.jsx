import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../lib/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // Restore the session once on mount. This is a network call now (it hits
  // /api/auth/refresh with the httpOnly cookie), so it is awaited. Until it
  // finishes we render nothing route-dependent, otherwise a signed-in user
  // gets bounced to /login on every page refresh.
  useEffect(() => {
    let alive = true;
    api
      .currentSession()
      .then((u) => alive && setUser(u))
      .catch(() => alive && setUser(null))
      .finally(() => alive && setBooting(false));
    return () => {
      alive = false;
    };
  }, []);

  const signIn = useCallback(async (creds) => {
    const u = await api.signIn(creds);
    setUser(u);
    return u;
  }, []);

  const signUp = useCallback(async (creds) => {
    const u = await api.signUp(creds);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(async () => {
    await api.signOut();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (patch) => {
      const u = await api.updateProfile(user.id, patch);
      setUser(u);
      return u;
    },
    [user],
  );

  // The backend requires the password to delete an account, so Settings passes
  // it through.
  const removeAccount = useCallback(
    async (password) => {
      await api.deleteAccount(user.id, password);
      setUser(null);
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, booting, signIn, signUp, signOut, updateProfile, removeAccount }),
    [user, booting, signIn, signUp, signOut, updateProfile, removeAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
