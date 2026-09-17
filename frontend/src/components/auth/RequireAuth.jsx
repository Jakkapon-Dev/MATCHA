import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, getToken } from '../../services/api';
import { useAuth } from '../../context/AuthContext.jsx';

export default function RequireAuth({ children }) {
  const location = useLocation();
  const { currentUser } = useAuth();
  const isDemo = Boolean(currentUser?.isDemoSession || getToken() === 'demo-offline-token');
  const [verdict, setVerdict] = useState(currentUser || isDemo ? 'allowed' : 'checking');

  useEffect(() => {
    if (isDemo || currentUser?.isDemoSession) {
      setVerdict('allowed');
      return;
    }

    let active = true;
    // ถ้ามี session อยู่แล้วใน AuthContext ถือว่าผ่านเบื้องต้นและ re-validate
    api.me()
      .then((res) => {
        if (!active) return;
        if (res && res.data) {
          setVerdict('allowed');
        } else {
          setVerdict('signed-out');
        }
      })
      .catch(() => {
        if (active) setVerdict('signed-out');
      });

    return () => { active = false; };
  }, [location.pathname, isDemo, currentUser]);

  if (verdict === 'checking') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-[#F1F1F1]">
        <div className="w-8 h-8 rounded-full border-2 border-[#DCDCDC] border-t-[#000000] animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#666666]">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
      </div>
    );
  }

  if (verdict === 'signed-out') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
