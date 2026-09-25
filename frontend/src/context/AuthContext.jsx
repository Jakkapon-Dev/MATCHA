import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { api, setToken } from '../services/api';

const AUTH_CONTEXT_KEY = Symbol.for('matcha.auth.context');
const AuthContext = globalThis[AUTH_CONTEXT_KEY] || (globalThis[AUTH_CONTEXT_KEY] = createContext(null));

/* Every write to storage goes through here.

   The reader below has always been guarded, with a comment about private mode
   to say why. The three writers were not, so Safari's private browsing, blocked
   site data and a full quota each threw out of a React event handler and into
   the error boundary: signed in on the server, holding a token, looking at a
   crash screen.

   Storage is a convenience for the next visit, never a condition of this one,
   so a failure is noted and the session carries on in memory. */
const SESSION_KEY = 'matcha_user';

const rememberSession = (user, persistent) => {
  try {
    const store = persistent ? localStorage : sessionStorage;
    const other = persistent ? sessionStorage : localStorage;
    store.setItem(SESSION_KEY, JSON.stringify(user));
    other.removeItem(SESSION_KEY);
  } catch (err) {
    console.warn('Session not persisted; storage is unavailable:', err.message);
  }
};

const forgetSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.warn('Session not cleared from storage:', err.message);
  }
};

/* The wishlist and saved looks live only in this browser, under keys that are
   not tied to an account. Left behind at sign-out, the next person to sign in
   here saw them as their own. A guest's lists still carry into the account
   they sign in to; it is signing out that ends them. The bag is emptied by
   CartProvider, which also knows the account's cart stays on the server.
   The Personal Color reading is the same kind of thing: kept only here, under
   no account, and read back by /personal-color and Mix & Match. */
const BROWSER_LIST_KEYS = [
  'matcha_wishlist',
  'matcha_saved_looks',
  'matcha_personal_color',
  'matcha_personal_color_reading',
];

const forgetBrowserLists = () => {
  try {
    BROWSER_LIST_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch (err) {
    console.warn('Saved lists not cleared from storage:', err.message);
  }
};

// Which store already holds the session, so an update lands where it lives.
const sessionIsPersistent = () => {
  try {
    return Boolean(localStorage.getItem(SESSION_KEY));
  } catch {
    return true;
  }
};

const loadInitialUser = () => {
  try {
    const saved = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    console.error('Failed to load user session:', err);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(loadInitialUser);

  // The signed-in user, readable from a callback without listing it as a
  // dependency — these go out through context and rebuilding them on every
  // change would re-render every consumer.
  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  const login = useCallback((userData, rememberMe = true, token = null) => {
    if (token) setToken(token, rememberMe);
    // The basket filled before signing in is handed to the account by
    // CartProvider, which merges it and shows the account's cart from the answer.
    currentUserRef.current = userData;
    setCurrentUser(userData);
    rememberSession(userData, rememberMe);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    currentUserRef.current = null;
    setCurrentUser(null);
    forgetSession();
    forgetBrowserLists();
  }, []);

  /* The storage write used to sit inside the setCurrentUser updater. Updaters
     must be pure — React is free to run one more than once, and under
     StrictMode it does — so the next user is built from the ref and the write
     happens out here, once.

     The confirmation toast went with it: ProfileTab already shows its own
     "saved" state, so the toast was a second announcement of one event, in
     English, on a page that had otherwise been translated. */
  const updateProfile = useCallback(async (updates) => {
    const response = await api.updateMyProfile(updates);
    const saved = response?.data || updates;
    const nextUser = { ...currentUserRef.current, ...saved };
    currentUserRef.current = nextUser;
    setCurrentUser(nextUser);
    rememberSession(nextUser, sessionIsPersistent());
    return nextUser;
  }, []);

  const commitProfileResponse = useCallback((response) => {
    const nextUser = { ...currentUserRef.current, ...(response?.data || {}) };
    currentUserRef.current = nextUser;
    setCurrentUser(nextUser);
    rememberSession(nextUser, sessionIsPersistent());
    return nextUser;
  }, []);

  const uploadProfileAvatar = useCallback(async (file) => {
    return commitProfileResponse(await api.uploadProfileAvatar(file));
  }, [commitProfileResponse]);

  const deleteProfileAvatar = useCallback(async () => {
    return commitProfileResponse(await api.deleteProfileAvatar());
  }, [commitProfileResponse]);

  const value = {
    currentUser,
    setCurrentUser,
    login,
    logout,
    updateProfile,
    uploadProfileAvatar,
    deleteProfileAvatar,
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
