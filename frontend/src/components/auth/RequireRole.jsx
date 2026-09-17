import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';

// Gate a route on the server's answer, not the browser's. The stored session is
// only a convenience: anyone can write a role into their own localStorage, so
// the decision comes from /auth/me, which is reached with the signed token.
export default function RequireRole({ role, children }) {
  const location = useLocation();
  // The verdict forms a small state machine: checking -> allowed, wrong-role,
  // or signed-out. Protected children render only after an allowed result.
  const [verdict, setVerdict] = useState('checking');

  useEffect(() => {
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
  }, [role, location.pathname]);

  if (verdict === 'checking') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-[#F1F1F1]">
        <div className="w-8 h-8 rounded-full border-2 border-[#DCDCDC] border-t-[#042509] animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#666666]">Verifying access</p>
      </div>
    );
  }

  if (verdict === 'signed-out') {
    // Preserve the attempted path so the login flow can return the user afterward.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (verdict === 'wrong-role') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-[#F1F1F1]">
        <div className="bg-white border border-[#DCDCDC] rounded-3xl p-8 sm:p-12 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#C91D1D]/10 text-[#C91D1D] flex items-center justify-center mx-auto">
            <ShieldAlert size={26} />
          </div>
          <h1 className="text-xl font-black uppercase text-[#000000] tracking-tight">Administrators only</h1>
          <p className="text-xs font-mono text-[#666666] leading-relaxed">
            This area is limited to store administrators. Your account does not have that access.
          </p>
          <a
            href="/"
            className="inline-block mt-2 px-5 py-3 bg-[#042509] hover:bg-[#021505] text-white text-xs font-bold font-mono uppercase tracking-widest rounded-xl shadow-md transition-all"
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
