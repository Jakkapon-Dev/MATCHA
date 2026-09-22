import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { api, getToken } from '../../services/api';
import { useAuth } from '../../context/AuthContext.jsx';

// Gate a route on the server's answer, not the browser's.
// In demo sessions, evaluate immediately against local state to allow offline presentations.
export default function RequireRole({ role, children }) {
  const location = useLocation();
  const { currentUser } = useAuth();
  const isDemo = Boolean(currentUser?.isDemoSession || getToken() === 'demo-offline-token');

  // The verdict forms a small state machine: checking -> allowed, wrong-role, or signed-out.
  const [verdict, setVerdict] = useState(() => {
    if (isDemo) {
      return !role || currentUser?.role === role ? 'allowed' : 'wrong-role';
    }
    return 'checking';
  });

  useEffect(() => {
    if (isDemo) {
      setVerdict(!role || currentUser?.role === role ? 'allowed' : 'wrong-role');
      return;
    }

    // Ignore late responses after unmount/navigation so an obsolete request cannot
    // update this guard. Path changes intentionally trigger a fresh authorization check.
    let active = true;
    api.me()
      .then((res) => {
        if (!active) return;
        const account = res.data || {};
        setVerdict(!role || account.role === role ? 'allowed' : 'wrong-role');
      })
      .catch(() => {
        if (active) setVerdict('signed-out');
      });
    return () => { active = false; };
  }, [role, location.pathname, isDemo, currentUser?.role]);

  if (verdict === 'checking') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-matcha-bg">
        <div className="w-8 h-8 rounded-full border-2 border-matcha-border border-t-matcha-primary animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-matcha-muted">Verifying access</p>
      </div>
    );
  }

  if (verdict === 'signed-out') {
    // Preserve the attempted path so the login flow can return the user afterward.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (verdict === 'wrong-role') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-matcha-bg">
        <div className="bg-white border border-matcha-border rounded-3xl p-8 sm:p-12 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-matcha-accent/10 text-matcha-accent flex items-center justify-center mx-auto">
            <ShieldAlert size={26} />
          </div>
          <h1 className="text-xl font-black uppercase text-matcha-text tracking-tight">Administrators only</h1>
          <p className="text-xs font-mono text-matcha-muted leading-relaxed">
            This area is limited to store administrators. Your account does not have that access.
          </p>
          <a
            href="/"
            className="inline-block mt-2 px-5 py-3 bg-matcha-primary hover:bg-matcha-primary-dark text-white text-xs font-bold font-mono uppercase tracking-widest rounded-xl shadow-md transition-all"
          >
            Back to the store
          </a>
        </div>
      </div>
    );
  }

  // Reaching this point means the server confirmed the required role.
  return children;
}
