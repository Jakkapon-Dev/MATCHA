import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';

// Gate a route on the server's answer, not the browser's. The stored session is
// only a convenience: anyone can write a role into their own localStorage, so
// the decision comes from /auth/me, which is reached with the signed token.
export default function RequireRole({ role, children }) {
  const location = useLocation();
  const [verdict, setVerdict] = useState('checking');

  useEffect(() => {
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-[#FAF8F5]">
        <div className="w-8 h-8 rounded-full border-2 border-[#D9D3C7] border-t-[#2D5A27] animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6B5E55]">Verifying access</p>
      </div>
    );
  }

  if (verdict === 'signed-out') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (verdict === 'wrong-role') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-[#FAF8F5]">
        <div className="bg-white border border-[#D9D3C7] rounded-3xl p-8 sm:p-12 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#BC5A36]/10 text-[#BC5A36] flex items-center justify-center mx-auto">
            <ShieldAlert size={26} />
          </div>
          <h1 className="text-xl font-black uppercase text-[#2D231E] tracking-tight">Administrators only</h1>
          <p className="text-xs font-mono text-[#6B5E55] leading-relaxed">
            This area is limited to store administrators. Your account does not have that access.
          </p>
          <a
            href="/"
            className="inline-block mt-2 px-5 py-3 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-bold font-mono uppercase tracking-widest rounded-xl shadow-md transition-all"
          >
            Back to the store
          </a>
        </div>
      </div>
    );
  }

  return children;
}
