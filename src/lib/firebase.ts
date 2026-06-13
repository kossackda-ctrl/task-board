'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, getDocs, deleteDoc, collection } from 'firebase/firestore';
import { AppState, migrateState } from './store';

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

const ROOM_KEY = 'task-board-room';

export function getSavedRoomCode(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ROOM_KEY);
}

export function saveRoomCode(code: string): void {
  localStorage.setItem(ROOM_KEY, code);
}

export function clearRoomCode(): void {
  localStorage.removeItem(ROOM_KEY);
}

export async function loadFromDB(roomCode: string): Promise<AppState | null> {
  const snap = await getDoc(doc(db, 'app', roomCode));
  if (!snap.exists()) return null;
  return migrateState(snap.data() as Partial<AppState>);
}

export async function saveToDB(roomCode: string, state: AppState): Promise<void> {
  try {
    await setDoc(doc(db, 'app', roomCode), state);
  } catch {
    // ネットワークエラーは無視
  }
}

export async function listAllRooms(): Promise<{ roomCode: string; state: AppState }[]> {
  try {
    const snap = await getDocs(collection(db, 'app'));
    return snap.docs.map(d => ({ roomCode: d.id, state: migrateState(d.data() as Partial<AppState>) }));
  } catch {
    return [];
  }
}

export async function deleteRoom(roomCode: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'app', roomCode));
  } catch {
    // ignore
  }
}

export async function getAdminPassword(): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, 'config', 'admin'));
    if (!snap.exists()) return null;
    return (snap.data().password as string) ?? null;
  } catch {
    return null;
  }
}

export async function setAdminPassword(password: string): Promise<void> {
  await setDoc(doc(db, 'config', 'admin'), { password });
}
