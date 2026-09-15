import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
const StoreModeContext = createContext(null);
const DEFAULT_CONFIG = { mode: 'demo', realPayments: false };

export function StoreModeProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    let active = true;
    api.getStoreConfig()
      .then(result => {
        if (['demo', 'live'].includes(result.data?.mode) && active) {
          setConfig(result.data);
        }
      })
      .catch(() => {
        // When backend is offline, keep demo fallback config so the frontend works standalone
        if (active) setConfig(DEFAULT_CONFIG);
      });
    return () => { active = false; };
  }, []);

  return (
    <StoreModeContext.Provider value={{ ...config, isDemo: config.mode === 'demo' }}>
      {children}
    </StoreModeContext.Provider>
  );
}
export const useStoreMode = () => useContext(StoreModeContext);
