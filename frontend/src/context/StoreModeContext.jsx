import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
const StoreModeContext = createContext(null);
export function StoreModeProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false);
    api.getStoreConfig().then(result => {
      if (!['demo', 'live'].includes(result.data?.mode)) throw new Error('Invalid mode');
      if (active) setConfig(result.data);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [attempt]);
  if (!config) return <main className="min-h-screen bg-[#FAF8F5] p-8 text-[#2D231E]" role={error ? 'alert' : 'status'}>{error ? <><h1 className="text-xl font-bold">ยังเชื่อมต่อร้านไม่ได้</h1><p className="my-3">กรุณาเปิด Backend แล้วลองใหม่</p><button className="px-5 py-3 rounded-xl bg-[#2D5A27] text-white" onClick={() => setAttempt(n => n + 1)}>ลองใหม่</button></> : <><div className="h-12 bg-[#EAE5DB] rounded-xl mb-6" /><p>กำลังโหลดร้าน…</p></>}</main>;
  return <StoreModeContext.Provider value={{ ...config, isDemo: config.mode === 'demo' }}>{children}</StoreModeContext.Provider>;
}
export const useStoreMode = () => useContext(StoreModeContext);
