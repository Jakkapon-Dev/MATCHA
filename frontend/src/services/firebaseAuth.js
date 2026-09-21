import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  reload,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigured = ['apiKey', 'authDomain', 'projectId', 'appId']
  .every((key) => Boolean(firebaseConfig[key]));

export function getFirebaseAuth() {
  if (!isConfigured) throw new Error('Firebase is not configured');
  const app = getApps()[0] || initializeApp(firebaseConfig);
  return getAuth(app);
}

export function getCurrentFirebaseUser() {
  try {
    const auth = getFirebaseAuth();
    return auth.currentUser;
  } catch {
    return null;
  }
}

export async function reloadFirebaseUser() {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return null;
  await reload(user);
  return auth.currentUser;
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(auth, provider);
  return credential.user.getIdToken();
}

export async function signUpWithEmail(email, password, displayName = '') {
  const auth = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && credential.user) {
    await updateProfile(credential.user, { displayName }).catch(() => {});
  }
  await sendEmailVerification(credential.user);
  return credential.user;
}

export async function signInWithEmail(email, password) {
  const auth = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function sendVerificationEmail(user) {
  const auth = getFirebaseAuth();
  const target = user || auth.currentUser;
  if (!target) throw new Error('No user is signed in');
  await sendEmailVerification(target);
}

export async function sendFirebasePasswordReset(email) {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email);
}
