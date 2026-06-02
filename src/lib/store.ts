'use client';

export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  assignee: string;
  startDate: string;
  endDate: string;
  memo: string;
  status: TaskStatus;
}

export interface Project {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface MemoEntry {
  id: string;
  projectId: string;
  text: string;
  createdAt: string;
  memberName?: string;
}

export interface ColumnNames {
  todo: string;
  doing: string;
  done: string;
}

export interface AppState {
  projects: Project[];
  tasks: Task[];
  memos: MemoEntry[];
  stars: number;
  columnNames: ColumnNames;
  adminMessage: { text: string; imageUrl: string };
  members: string[];
}

export const DEFAULT_STATE: AppState = {
  projects: [],
  tasks: [],
  memos: [],
  stars: 0,
  columnNames: { todo: 'やること', doing: 'やっている', done: 'おわった' },
  adminMessage: { text: '', imageUrl: '' },
  members: [],
};

const KEY = 'task-board-v1';

export function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
