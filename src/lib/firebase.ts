'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { AppState, DEFAULT_STATE } from './store';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const stateRef = doc(db, 'app', 'state');

export async function loadFromDB(): Promise<AppState> {
  try {
    const snap = await getDoc(stateRef);
    if (!snap.exists()) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...snap.data() } as AppState;
  } catch {
    return DEFAULT_STATE;
  }
}

export async function saveToDB(state: AppState): Promise<void> {
  try {
    await setDoc(stateRef, state);
  } catch {
    // ネットワークエラーは無視
  }
}
