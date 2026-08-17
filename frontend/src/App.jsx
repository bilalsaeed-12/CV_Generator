import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import SiteLayout from './components/layout/SiteLayout';
import Landing from './pages/Landing';
import Templates from './pages/Templates';
import HowItWorks from './pages/HowItWorks';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';
import PublicResume from './pages/PublicResume';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { useAuth } from './context/AuthContext';
import { Spinner } from './components/ui/Feedback';

function Booting() {
  return (
    <div className="flex min-h-screen items-center justify-center text-graphite-faint">
      <Spinner className="h-5 w-5" />
    </div>
  );
}

/** Signed-in only. Remembers where you were headed so sign-in can return you. */
function Protected({ children }) {
  const { user, booting } = useAuth();
  const location = useLocation();

  if (booting) return <Booting />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

/** Signed-out only — no reason to show sign-in to someone already in. */
function GuestOnly({ children }) {
  const { user, booting } = useAuth();
  if (booting) return <Booting />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* The builder and the public page are full-bleed: no site chrome. */}
      <Route
        path="/builder/:id"
        element={
          <Protected>
            <Builder />
          </Protected>
        }
      />
      <Route path="/r/:slug" element={<PublicResume />} />

      {/* Everything else sits inside the marketing shell. */}
      <Route element={<SiteLayout />}>
        <Route index element={<Landing />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/pricing" element={<Pricing />} />

        <Route
          path="/login"
          element={
            <GuestOnly>
              <Login />
            </GuestOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestOnly>
              <Signup />
            </GuestOnly>
          }
        />

        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/settings"
          element={
            <Protected>
              <Settings />
            </Protected>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
