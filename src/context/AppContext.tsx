'use client';

import React, { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppState, Task, Project, MemoEntry, DEFAULT_STATE, uid } from '@/lib/store';
import { loadFromDB, saveToDB } from '@/lib/firebase';
import RoomEntry from '@/components/RoomEntry';

type Action =
  | { type: 'ADD_PROJECT'; payload: Omit<Project, 'id'> }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id'> }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'COMPLETE_TASK'; payload: string }
  | { type: 'ADD_MEMO'; payload: Omit<MemoEntry, 'id' | 'createdAt'> }
  | { type: 'SET_COLUMN_NAMES'; payload: AppState['columnNames'] }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'RESET_STARS' }
  | { type: 'RENAME_PROJECT'; payload: { id: string; name: string } };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, { ...action.payload, id: uid() }] };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        tasks: state.tasks.filter(t => t.projectId !== action.payload),
        memos: state.memos.filter(m => m.projectId !== action.payload),
      };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, { ...action.payload, id: uid() }] };
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case 'COMPLETE_TASK': {
      const updated = state.tasks.map(t =>
        t.id === action.payload ? { ...t, status: 'done' as const } : t
      );
      return { ...state, tasks: updated, stars: state.stars + 1 };
    }
    case 'ADD_MEMO':
      return {
        ...state,
        memos: [
          { ...action.payload, id: uid(), createdAt: new Date().toISOString() },
          ...state.memos,
        ],
      };
    case 'SET_COLUMN_NAMES':
      return { ...state, columnNames: action.payload };
    case 'LOAD_STATE':
      return action.payload;
    case 'RESET_STARS':
      return { ...state, stars: 0 };
    case 'RENAME_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.id ? { ...p, name: action.payload.name } : p
        ),
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  roomCode: string;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === '/admin';
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!roomCode) return;
    hasLoaded.current = false;
    setLoading(true);
    loadFromDB(roomCode).then(saved => {
      if (saved === null) {
        setRoomCode(null);
        setRoomError('この合言葉は見つかりませんでした');
        setLoading(false);
      } else {
        dispatch({ type: 'LOAD_STATE', payload: saved });
        hasLoaded.current = true;
        setRoomError(null);
        setLoading(false);
      }
    }).catch(() => {
      setRoomCode(null);
      setRoomError('接続エラーが発生しました。もう一度お試しください。');
      setLoading(false);
    });
  }, [roomCode]);

  useEffect(() => {
    if (!loading && roomCode && hasLoaded.current) {
      saveToDB(roomCode, state);
    }
  }, [state, loading, roomCode]);

  const enterRoom = (code: string) => {
    setRoomCode(code);
  };

  if (!roomCode && !isAdmin) {
    return <RoomEntry onEnter={enterRoom} error={roomError} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-indigo-50">
        <div className="text-indigo-400 text-lg font-bold animate-pulse">読み込み中...</div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ state, dispatch, roomCode: roomCode ?? '' }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
