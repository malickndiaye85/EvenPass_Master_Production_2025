import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDPsWVCA_Czs64wxiBOqUCSWwbkLMPNjJo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'evenpasssenegal.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'evenpasssenegal',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'evenpasssenegal.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '882782977052',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:882782977052:web:1f2ea147010066017cf3d9',
  measurementId: 'G-FVQTV8TMLJ'
};

// Check if Firebase config is complete
const isFirebaseConfigured = firebaseConfig.projectId &&
                             firebaseConfig.apiKey &&
                             firebaseConfig.appId;

let app: any = null;
let db: any = null;
let firestore: any = null;
let storage: any = null;
let auth: any = null;
let analytics: any = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  firestore = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
  analytics = typeof window !== 'undefined' && firebaseConfig.measurementId ? getAnalytics(app) : null;

  console.log('[FIREBASE] ✅ Firebase initialized successfully');

  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('[FIREBASE] Error setting persistence:', error);
  });
} else {
  console.warn('[FIREBASE] Configuration incomplete. Firebase services disabled. Please configure Firebase environment variables in .env file.');
}

export { app, db, firestore, storage, auth, analytics };
