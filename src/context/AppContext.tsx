'use client';

import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { AppState, Task, Project, MemoEntry, DEFAULT_STATE, loadState, saveState, uid } from '@/lib/store';

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
  | { type: 'RESET_STARS' };

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
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const saved = loadState();
      dispatch({ type: 'LOAD_STATE', payload: saved });
      return;
    }
    saveState(state);
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
