import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

const loadInitialUser = () => {
  try {
    const saved = localStorage.getItem('matcha_user') || sessionStorage.getItem('matcha_user');
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    console.error('Failed to load user session:', err);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(loadInitialUser);
  const { showToast } = useToast();

  const login = useCallback((userData, rememberMe = true) => {
    setCurrentUser(userData);
    if (rememberMe) {
      localStorage.setItem('matcha_user', JSON.stringify(userData));
      sessionStorage.removeItem('matcha_user');
    } else {
      sessionStorage.setItem('matcha_user', JSON.stringify(userData));
      localStorage.removeItem('matcha_user');
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('matcha_user');
    sessionStorage.removeItem('matcha_user');
  }, []);

  const updateProfile = useCallback((updates) => {
    setCurrentUser((prev) => {
      const nextUser = { ...prev, ...updates };
      if (localStorage.getItem('matcha_user')) {
        localStorage.setItem('matcha_user', JSON.stringify(nextUser));
      } else {
        sessionStorage.setItem('matcha_user', JSON.stringify(nextUser));
      }
      return nextUser;
    });
    showToast('Profile updated successfully! ✨');
  }, [showToast]);

  const value = {
    currentUser,
    setCurrentUser,
    login,
    logout,
    updateProfile,
    isAuthenticated: Boolean(currentUser),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
