'use client';

export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  /** 旧データ互換用（表示・編集は assignees を使う） */
  assignee: string;
  assignees: string[];
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

export interface MinuteEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface ColumnNames {
  todo: string;
  doing: string;
  done: string;
}

/** 削除されたデータの一時保管（24時間後に自動消去、管理者画面から復旧可能） */
export type TrashItem =
  | { id: string; deletedAt: string; kind: 'project'; project: Project; tasks: Task[]; memos: MemoEntry[] }
  | { id: string; deletedAt: string; kind: 'task'; task: Task }
  | { id: string; deletedAt: string; kind: 'minute'; minute: MinuteEntry };

export const TRASH_RETENTION_MS = 24 * 60 * 60 * 1000;

export function purgeTrash(trash: TrashItem[]): TrashItem[] {
  const cutoff = Date.now() - TRASH_RETENTION_MS;
  return trash.filter(t => new Date(t.deletedAt).getTime() > cutoff);
}

export interface AppState {
  projects: Project[];
  tasks: Task[];
  memos: MemoEntry[];
  stars: number;
  columnNames: ColumnNames;
  adminMessage: { text: string; imageUrl: string };
  members: string[];
  minutes: MinuteEntry[];
  annualScheduleUrl: string;
  trash: TrashItem[];
}

export const DEFAULT_STATE: AppState = {
  projects: [],
  tasks: [],
  memos: [],
  stars: 0,
  columnNames: { todo: 'やること', doing: 'やっている', done: 'おわった' },
  adminMessage: { text: '', imageUrl: '' },
  members: [],
  minutes: [],
  annualScheduleUrl: '',
  trash: [],
};

/** 古いデータを最新の形に変換する（assignee → assignees、trash の補完と期限切れ削除） */
export function migrateState(raw: Partial<AppState>): AppState {
  const s = { ...DEFAULT_STATE, ...raw };
  return {
    ...s,
    tasks: (s.tasks ?? []).map(t => ({
      ...t,
      assignees: t.assignees ?? (t.assignee ? [t.assignee] : []),
    })),
    trash: purgeTrash(s.trash ?? []),
  };
}

const KEY = 'task-board-v1';

export function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    return migrateState(JSON.parse(raw));
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
